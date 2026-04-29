import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { findProductByPayload } from "../_shared/find-product-by-payload.ts";
import { validateWebhookSignature } from "../_shared/verify-webhook-signature.ts";
import { decidePurchaseAction } from "../_shared/decide-purchase-action.ts";

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

    // Buscar produto baseado no external_product_id ou product_id.
    // Lógica extraída para `findProductByPayload` (testável; ver Bug 3 do
    // TEST-GAP-ANALYSIS para o histórico do .or() injection).
    const product = await findProductByPayload(supabaseAdmin, payload);
    if (!product) {
      console.error('Product not found:', {
        external_product_id: payload.external_product_id,
        product_id: payload.product_id,
      });
      throw new Error('Product not found');
    }

    // Verificar se a compra já existe
    const { data: existingPurchase } = await supabaseAdmin
      .from('purchases')
      .select('id, status, approved_at')
      .eq('external_transaction_id', payload.transaction_id)
      .maybeSingle();

    // Decisão idempotente: INSERT vs UPDATE + se dispara email/notificação.
    // A lógica está em `decidePurchaseAction` (testada por unit tests).
    const decision = decidePurchaseAction({
      payload: { status: payload.status, amount: payload.amount },
      existing: existingPurchase,
    });

    let purchaseId: string;

    if (decision.action === 'UPDATE') {
      const { error: updateError } = await supabaseAdmin
        .from('purchases')
        .update({
          status: decision.status,
          amount_paid: decision.amountPaid,
          approved_at: decision.approvedAt,
        })
        .eq('id', decision.existingId!);

      if (updateError) throw updateError;
      purchaseId = decision.existingId!;
      console.log('Purchase updated:', purchaseId);
    } else {
      const { data: newPurchase, error: purchaseError } = await supabaseAdmin
        .from('purchases')
        .insert({
          user_id: userId,
          product_id: product.id,
          payment_platform: payload.platform,
          external_transaction_id: payload.transaction_id,
          status: decision.status,
          amount_paid: decision.amountPaid,
          approved_at: decision.approvedAt,
        })
        .select()
        .single();

      if (purchaseError) throw purchaseError;
      purchaseId = newPurchase.id;
      console.log('New purchase created:', purchaseId);
    }

    // Email + notificação apenas na primeira transição para approved.
    // Replays do mesmo payload approved ou downgrades não re-disparam (idempotência).
    if (decision.shouldFireApprovalEmail) {
      try {
        await supabaseAdmin.functions.invoke('send-purchase-confirmation', {
          body: { purchaseId },
        });
        console.log('Confirmation email sent for purchase:', purchaseId);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Não bloqueia o webhook se o email falhar
      }

      const isNew = decision.action === 'INSERT';
      try {
        await supabaseAdmin.functions.invoke('send-notification', {
          body: {
            userId,
            title: isNew ? 'Bem-vindo!' : 'Pagamento Aprovado!',
            message: isNew
              ? 'Sua compra foi aprovada. Comece agora seus estudos!'
              : 'Seu pagamento foi confirmado. Você já tem acesso ao curso!',
            type: 'success',
          },
        });
        console.log('Notification sent');
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: decision.action === 'INSERT' ? 'Purchase created' : 'Purchase updated',
        purchase_id: purchaseId,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: decision.action === 'INSERT' ? 201 : 200,
      }
    );

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
