import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

/**
 * WEBHOOK DE PAGAMENTOS
 *
 * Este webhook processa pagamentos de diversas plataformas.
 * Atualmente suportado: Hotmart, Kiwify, Monetizze
 *
 * ─── VALIDAÇÃO DE ASSINATURA POR PLATAFORMA ──────────────────────────────────
 *
 * Este endpoint exige autenticação via header ANTES de processar o payload.
 * A variável de ambiente WEBHOOK_SECRET deve ser configurada no Supabase
 * (Dashboard → Edge Functions → Secrets).
 *
 * Comportamento:
 *   - O header `x-webhook-signature` deve estar presente em todas as chamadas.
 *   - O valor do header é comparado com WEBHOOK_SECRET usando comparação
 *     de tempo constante (timingSafeEqual) para evitar timing attacks.
 *   - Se ausente ou incorreto → 401 Unauthorized (sem detalhes no body).
 *
 * Como cada plataforma envia sua assinatura (para referência futura):
 *
 *   HOTMART:
 *     Header: hottok (valor configurado no painel Hotmart)
 *     Quando migrar: ler req.headers.get('hottok') e comparar com WEBHOOK_SECRET.
 *
 *   KIWIFY:
 *     Query param: ?signature=<sha1-hex>
 *     Quando migrar: calcular HMAC-SHA1(body, WEBHOOK_SECRET) e comparar.
 *
 *   MONETIZZE:
 *     Header: x-monetizze-token (valor gerado na integração Monetizze)
 *     Quando migrar: ler req.headers.get('x-monetizze-token') e comparar.
 *
 *   STRIPE:
 *     Header: stripe-signature
 *     Quando migrar: usar stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET).
 *
 *   MERCADO PAGO:
 *     Header: x-signature  (formato: ts=<ts>,v1=<hmac-sha256>)
 *     Quando migrar: calcular HMAC-SHA256(ts + "." + data.id, MERCADOPAGO_SECRET).
 *
 * Abordagem atual (generic shared secret):
 *   Todas as plataformas devem enviar o WEBHOOK_SECRET como valor do header
 *   `x-webhook-signature`. Isso é o mínimo aceitável enquanto não há integração
 *   nativa com o esquema de assinatura de cada plataforma.
 *
 * COMO ADICIONAR NOVOS MÉTODOS DE PAGAMENTO:
 *
 * 1. STRIPE (Recomendado para pagamentos internacionais):
 *    - Adicionar o tipo 'stripe' no platform
 *    - Validar assinatura do webhook Stripe: req.headers.get('stripe-signature')
 *    - Parsear evento Stripe e mapear para WebhookPayload
 *    - Documentação: https://stripe.com/docs/webhooks
 *
 * 2. MERCADO PAGO (Recomendado para América Latina):
 *    - Adicionar o tipo 'mercadopago' no platform
 *    - Validar x-signature header
 *    - Mapear eventos: payment.created, payment.updated
 *    - Documentação: https://www.mercadopago.com.br/developers/pt/docs/webhooks
 *
 * 3. PAYPAL:
 *    - Adicionar o tipo 'paypal' no platform
 *    - Validar webhook signature
 *    - Mapear eventos: PAYMENT.SALE.COMPLETED
 *    - Documentação: https://developer.paypal.com/api/rest/webhooks/
 *
 * 4. PIX (Via gateway brasileiro):
 *    - Adicionar o tipo 'pix' no platform
 *    - Integrar com gateway (Asaas, PagSeguro, etc)
 *    - Validar notificação de confirmação
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, stripe-signature',
};

interface WebhookPayload {
  platform: 'hotmart' | 'kiwify' | 'monetizze' | 'stripe' | 'mercadopago' | 'paypal' | 'pix' | 'other';
  event: string;
  product_id?: string;
  external_product_id?: string;
  customer_email: string;
  customer_name?: string;
  transaction_id: string;
  amount?: number;
  status: 'approved' | 'pending' | 'cancelled' | 'refunded';
}

/**
 * Compara duas strings byte-a-byte em tempo constante para evitar timing attacks.
 * Retorna true apenas se forem idênticas em comprimento e conteúdo.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  // Lengths must match; we still iterate the full length to avoid leaking via timing
  if (aBytes.length !== bBytes.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i];
  }
  return result === 0;
}

/**
 * Validates the incoming webhook request against WEBHOOK_SECRET.
 *
 * The caller must send the shared secret as the value of the
 * `x-webhook-signature` header.  Returns false (→ 401) when:
 *   - WEBHOOK_SECRET env var is not configured
 *   - Header is absent
 *   - Header value does not match WEBHOOK_SECRET
 */
function validateWebhookSignature(req: Request): boolean {
  const webhookSecret = Deno.env.get('WEBHOOK_SECRET');

  // If the secret is not configured, reject all requests to avoid silently
  // running in an unauthenticated state.
  if (!webhookSecret) {
    console.error('WEBHOOK_SECRET environment variable is not set. All webhook requests will be rejected.');
    return false;
  }

  const signature = req.headers.get('x-webhook-signature');

  if (!signature) {
    console.warn('Webhook rejected: missing x-webhook-signature header');
    return false;
  }

  const valid = timingSafeEqual(signature, webhookSecret);

  if (!valid) {
    console.warn('Webhook rejected: invalid x-webhook-signature header');
  }

  return valid;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ── SECURITY: Validate webhook signature before processing anything ──────
  if (!validateWebhookSignature(req)) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', success: false }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      }
    );
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const payload: WebhookPayload = await req.json();
    console.log('Webhook received:', JSON.stringify(payload, null, 2));

    // Validar dados obrigatórios
    if (!payload.customer_email || !payload.transaction_id) {
      throw new Error('Missing required fields: customer_email or transaction_id');
    }

    // Buscar ou criar usuário
    let userId: string;

    // Primeiro tenta buscar usuário existente
    const { data: existingUser } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', payload.customer_email)
      .maybeSingle();

    if (existingUser) {
      userId = existingUser.id;
      console.log('User found:', userId);
    } else {
      // Criar novo usuário se não existir
      const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: payload.customer_email,
        email_confirm: true,
        user_metadata: {
          full_name: payload.customer_name || '',
        }
      });

      if (userError) throw userError;
      userId = newUser.user.id;
      console.log('New user created:', userId);
    }

    // Buscar produto baseado no external_product_id ou product_id
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .or(`external_product_id.eq.${payload.external_product_id},id.eq.${payload.product_id}`)
      .maybeSingle();

    if (productError || !product) {
      console.error('Product not found:', { external_product_id: payload.external_product_id, product_id: payload.product_id });
      throw new Error('Product not found');
    }

    // Verificar se a compra já existe
    const { data: existingPurchase } = await supabaseAdmin
      .from('purchases')
      .select('id, status')
      .eq('external_transaction_id', payload.transaction_id)
      .maybeSingle();

    if (existingPurchase) {
      // Atualizar compra existente
      const { error: updateError } = await supabaseAdmin
        .from('purchases')
        .update({
          status: payload.status,
          amount_paid: payload.amount,
          approved_at: payload.status === 'approved' ? new Date().toISOString() : null,
        })
        .eq('id', existingPurchase.id);

      if (updateError) throw updateError;

      console.log('Purchase updated:', existingPurchase.id);

      // Enviar email se status mudou para approved
      if (payload.status === 'approved' && existingPurchase.status !== 'approved') {
        try {
          await supabaseAdmin.functions.invoke('send-purchase-confirmation', {
            body: { purchaseId: existingPurchase.id }
          });
          console.log('Confirmation email sent for purchase:', existingPurchase.id);
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Não bloqueia o webhook se o email falhar
        }

        // Enviar notificação
        try {
          await supabaseAdmin.functions.invoke('send-notification', {
            body: {
              userId: userId,
              title: 'Pagamento Aprovado!',
              message: `Seu pagamento foi confirmado. Você já tem acesso ao curso!`,
              type: 'success'
            }
          });
          console.log('Notification sent');
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Purchase updated',
          purchase_id: existingPurchase.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } else {
      // Criar nova compra
      const { data: newPurchase, error: purchaseError } = await supabaseAdmin
        .from('purchases')
        .insert({
          user_id: userId,
          product_id: product.id,
          status: payload.status,
          amount_paid: payload.amount,
          payment_platform: payload.platform,
          external_transaction_id: payload.transaction_id,
          approved_at: payload.status === 'approved' ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;

      console.log('New purchase created:', newPurchase.id);

      // Enviar email se já foi criado aprovado
      if (payload.status === 'approved') {
        try {
          await supabaseAdmin.functions.invoke('send-purchase-confirmation', {
            body: { purchaseId: newPurchase.id }
          });
          console.log('Confirmation email sent for new purchase:', newPurchase.id);
        } catch (emailError) {
          console.error('Error sending email:', emailError);
          // Não bloqueia o webhook se o email falhar
        }

        // Enviar notificação
        try {
          await supabaseAdmin.functions.invoke('send-notification', {
            body: {
              userId: userId,
              title: 'Bem-vindo!',
              message: `Sua compra foi aprovada. Comece agora seus estudos!`,
              type: 'success'
            }
          });
          console.log('Notification sent');
        } catch (notifError) {
          console.error('Error sending notification:', notifError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Purchase created',
          purchase_id: newPurchase.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201
        }
      );
    }

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({
        error: errorMessage,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
