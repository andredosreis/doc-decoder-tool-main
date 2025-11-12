# Guia de Integração de Pagamentos

Esta plataforma suporta múltiplos métodos de pagamento através de webhooks.

## Métodos Atualmente Implementados

### 1. Hotmart
- Webhook configurado para receber notificações de compra
- Suporta status: aprovado, cancelado, reembolsado

### 2. Kiwify  
- Webhook configurado para receber notificações de compra
- Suporta status: aprovado, cancelado, reembolsado

### 3. Monetizze
- Webhook configurado para receber notificações de compra
- Suporta status: aprovado, cancelado, reembolsado

---

## Como Adicionar Novos Métodos de Pagamento

### Stripe (Recomendado - Internacional)

**Vantagens:**
- Aceita cartões internacionais
- Suporte a múltiplas moedas
- Checkout customizável
- Suporte a assinaturas recorrentes

**Passos para Implementação:**

1. **Adicionar dependência Stripe:**
```typescript
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
```

2. **Configurar secrets:**
- `STRIPE_SECRET_KEY` - Chave secreta da API
- `STRIPE_WEBHOOK_SECRET` - Secret do webhook

3. **Validar webhook:**
```typescript
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
const signature = req.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  rawBody,
  signature,
  Deno.env.get('STRIPE_WEBHOOK_SECRET')
);
```

4. **Mapear eventos:**
- `checkout.session.completed` → approved
- `payment_intent.succeeded` → approved
- `charge.refunded` → refunded

**Recursos:**
- [Documentação Stripe](https://stripe.com/docs)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)

---

### Mercado Pago (Recomendado - América Latina)

**Vantagens:**
- Popular no Brasil e América Latina
- Suporte a PIX, boleto, cartão
- Checkout em português

**Passos para Implementação:**

1. **Instalar SDK:**
```typescript
import mercadopago from 'https://esm.sh/mercadopago@1.5.17';
```

2. **Configurar secrets:**
- `MERCADOPAGO_ACCESS_TOKEN`

3. **Validar webhook:**
```typescript
const xSignature = req.headers.get('x-signature');
const xRequestId = req.headers.get('x-request-id');
// Validar assinatura conforme docs
```

4. **Mapear eventos:**
- `payment.created` → pending
- `payment.updated` (status: approved) → approved
- `payment.updated` (status: refunded) → refunded

**Recursos:**
- [Documentação Mercado Pago](https://www.mercadopago.com.br/developers)
- [Webhooks Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs/webhooks)

---

### PayPal

**Vantagens:**
- Aceito globalmente
- Suporte a múltiplas moedas
- Reconhecido e confiável

**Passos para Implementação:**

1. **Configurar secrets:**
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_WEBHOOK_ID`

2. **Validar webhook:**
```typescript
const headers = {
  'auth-algo': req.headers.get('paypal-auth-algo'),
  'cert-url': req.headers.get('paypal-cert-url'),
  'transmission-id': req.headers.get('paypal-transmission-id'),
  'transmission-sig': req.headers.get('paypal-transmission-sig'),
  'transmission-time': req.headers.get('paypal-transmission-time'),
};
// Validar usando PayPal SDK
```

3. **Mapear eventos:**
- `PAYMENT.SALE.COMPLETED` → approved
- `PAYMENT.SALE.REFUNDED` → refunded

**Recursos:**
- [Documentação PayPal](https://developer.paypal.com/)
- [Webhooks PayPal](https://developer.paypal.com/api/rest/webhooks/)

---

### PIX (Via Gateway Brasileiro)

**Opções de Gateway:**

#### Asaas
- API simples e documentada
- Suporte a PIX, boleto, cartão
- Webhook em tempo real

#### PagSeguro
- Grande reconhecimento no Brasil
- Múltiplos métodos de pagamento
- Checkout transparente

#### Gerencianet (Efí Bank)
- Focado em PIX
- API robusta
- Taxas competitivas

**Implementação Geral (PIX):**

1. **Configurar secrets do gateway escolhido**

2. **Criar QR Code PIX:**
```typescript
const pixPayment = await gateway.createPixCharge({
  amount: 99.90,
  customer: { email, name },
  metadata: { product_id }
});
```

3. **Webhook de confirmação:**
```typescript
// Quando PIX for pago, gateway envia notificação
if (event.type === 'pix.paid') {
  // Aprovar compra automaticamente
}
```

---

## Estrutura do Webhook

O webhook está em: `supabase/functions/webhook-payment/index.ts`

### Formato do Payload Esperado:

```typescript
{
  platform: 'stripe' | 'mercadopago' | 'paypal' | 'pix',
  event: 'payment.completed',
  product_id: 'uuid-do-produto',
  external_product_id: 'id-externo-opcional',
  customer_email: 'cliente@email.com',
  customer_name: 'Nome do Cliente',
  transaction_id: 'id-unico-transacao',
  amount: 99.90,
  status: 'approved' | 'pending' | 'cancelled' | 'refunded'
}
```

### Fluxo de Processamento:

1. **Validar assinatura** do webhook
2. **Buscar ou criar usuário** com base no email
3. **Buscar produto** pelo ID
4. **Criar/atualizar compra** na tabela `purchases`
5. **Enviar email** de confirmação (se aprovado)
6. **Enviar notificação** para o usuário

---

## Boas Práticas

### Segurança
- ✅ **SEMPRE validar** a assinatura do webhook
- ✅ **Usar HTTPS** para receber webhooks
- ✅ **Armazenar secrets** no Supabase Secrets
- ✅ **Log todas as tentativas** de webhook
- ❌ **Nunca confiar** apenas no payload sem validação

### Idempotência
- Use `transaction_id` como chave única
- Verifique se a compra já existe antes de criar
- Atualize status em vez de criar duplicatas

### Tratamento de Erros
- Retorne status 200 para webhooks processados
- Retorne status 400 para webhooks inválidos
- Log detalhado para debugging
- Não bloqueie o webhook se email/notificação falhar

### Testes
- Use ambiente sandbox/teste da plataforma
- Teste todos os status possíveis
- Verifique logs no Supabase

---

## Configuração do Webhook URL

A URL do webhook é:
```
https://[SEU-PROJECT-ID].supabase.co/functions/v1/webhook-payment
```

Configure esta URL no painel de cada plataforma de pagamento.

---

## Próximos Passos Recomendados

1. **Implementar Stripe** para pagamentos internacionais
2. **Implementar Mercado Pago** para Brasil/LATAM
3. **Adicionar PIX** via Asaas ou Gerencianet
4. **Criar painel de analytics** de vendas
5. **Implementar relatórios** de receita
6. **Adicionar cupons** de desconto
7. **Criar sistema de afiliados**

---

## Suporte

Para dúvidas ou problemas:
1. Verifique os logs no Supabase Edge Functions
2. Consulte a documentação da plataforma de pagamento
3. Teste com ambiente sandbox primeiro
