# TODO - Melhorias no Sistema de Pagamentos

## 🚀 Prioridade Alta

### 1. Integração com Stripe
- [ ] Adicionar dependência Stripe SDK
- [ ] Configurar secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- [ ] Implementar validação de webhook Stripe
- [ ] Mapear eventos Stripe para status de compra
- [ ] Criar página de checkout Stripe
- [ ] Testar em modo sandbox
- [ ] Documentar processo de configuração

**Benefícios:**
- Pagamentos internacionais
- Múltiplas moedas
- Checkout profissional
- Suporte a assinaturas

**Arquivos a modificar:**
- `supabase/functions/webhook-payment/index.ts`
- Criar: `src/pages/checkout/StripeCheckout.tsx`

---

### 2. Integração com Mercado Pago
- [ ] Adicionar SDK Mercado Pago
- [ ] Configurar access token
- [ ] Implementar validação de webhook
- [ ] Suporte a PIX automático
- [ ] Suporte a boleto
- [ ] Interface de checkout em PT-BR
- [ ] Testar em sandbox

**Benefícios:**
- Popular no Brasil
- Suporte a PIX nativo
- Parcelamento automático
- Reconhecimento local

**Arquivos a modificar:**
- `supabase/functions/webhook-payment/index.ts`
- Criar: `src/pages/checkout/MercadoPagoCheckout.tsx`

---

## 🎯 Prioridade Média

### 3. Dashboard de Vendas Avançado
- [ ] Gráfico de receita por período
- [ ] Gráfico de conversão (funil)
- [ ] Taxa de abandono de carrinho
- [ ] Produtos mais vendidos
- [ ] Análise de reembolsos
- [ ] Exportar relatórios (CSV/PDF)
- [ ] Métricas de LTV (Lifetime Value)
- [ ] Comparação período anterior

**Arquivos a criar:**
- `src/pages/admin/Analytics.tsx`
- `src/components/admin/SalesChart.tsx`
- `src/components/admin/RevenueMetrics.tsx`

---

### 4. Sistema de Cupons de Desconto
- [ ] Tabela de cupons no banco
- [ ] CRUD de cupons (criar, editar, deletar)
- [ ] Tipos: percentual, valor fixo
- [ ] Limite de uso (total e por usuário)
- [ ] Data de validade
- [ ] Cupons específicos por produto
- [ ] Aplicar cupom no checkout
- [ ] Relatório de uso de cupons

**Migração necessária:**
```sql
CREATE TABLE coupons (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'percentage' | 'fixed'
  value NUMERIC NOT NULL,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  valid_from TIMESTAMP,
  valid_until TIMESTAMP,
  product_id UUID REFERENCES products(id),
  created_at TIMESTAMP DEFAULT now()
);
```

**Arquivos a criar:**
- `src/pages/admin/Coupons.tsx`
- `src/components/CouponInput.tsx`

---

### 5. Gateway PIX Nativo
- [ ] Integrar com Asaas ou Gerencianet
- [ ] Gerar QR Code PIX
- [ ] Mostrar código copia-e-cola
- [ ] Validação em tempo real
- [ ] Expiração automática (15min)
- [ ] Notificação de pagamento confirmado
- [ ] Retry automático se falhar

**Benefícios:**
- Método de pagamento mais usado no Brasil
- Confirmação instantânea
- Sem taxas de intermediário (se gateway próprio)

**Arquivos a criar:**
- `supabase/functions/create-pix/index.ts`
- `supabase/functions/pix-webhook/index.ts`
- `src/pages/checkout/PixCheckout.tsx`

---

## 💡 Prioridade Baixa

### 6. Sistema de Afiliados
- [ ] Tabela de afiliados
- [ ] Gerar links únicos de afiliado
- [ ] Rastreamento de conversões
- [ ] Comissões configuráveis
- [ ] Dashboard do afiliado
- [ ] Pagamento automático de comissões
- [ ] Relatório de performance

### 7. Checkout Otimizado
- [ ] One-click checkout para compradores recorrentes
- [ ] Salvar métodos de pagamento
- [ ] Checkout sem necessidade de cadastro
- [ ] Upsells e cross-sells
- [ ] Recuperação de carrinho abandonado
- [ ] Email de lembrete 24h depois
- [ ] Cupom automático para retorno

### 8. Assinaturas Recorrentes
- [ ] Planos mensais/anuais
- [ ] Renovação automática
- [ ] Gestão de assinaturas
- [ ] Trial gratuito
- [ ] Cancelamento e reativação
- [ ] Cobrança recorrente via Stripe
- [ ] Notificações de renovação

### 9. Split de Pagamento
- [ ] Dividir receita com co-produtores
- [ ] Configurar % de split por produto
- [ ] Transferência automática
- [ ] Relatório de splits

### 10. Internacionalização
- [ ] Suporte a múltiplas moedas
- [ ] Conversão automática
- [ ] Checkout em múltiplos idiomas
- [ ] Impostos por região
- [ ] Compliance internacional

---

## 🔧 Melhorias Técnicas

### Testes
- [ ] Testes unitários para webhook
- [ ] Testes de integração com sandbox
- [ ] Testes E2E do fluxo de compra
- [ ] Mock de respostas de gateway

### Segurança
- [ ] Rate limiting no webhook
- [ ] Validação avançada de assinatura
- [ ] Logs de auditoria
- [ ] Alertas de fraude
- [ ] Blacklist de emails/IPs

### Performance
- [ ] Cache de produtos
- [ ] Otimização de queries
- [ ] CDN para assets estáticos
- [ ] Lazy loading de imagens

---

## 📊 Métricas de Sucesso

Após implementações, acompanhar:
- Taxa de conversão de checkout
- Tempo médio de checkout
- Abandono de carrinho
- Receita recorrente (MRR)
- Chargeback rate
- Customer Lifetime Value (LTV)
- Cost per Acquisition (CPA)

---

## 🎓 Recursos de Aprendizado

### Stripe
- [Stripe Docs](https://stripe.com/docs)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [Webhooks Guide](https://stripe.com/docs/webhooks)

### Mercado Pago
- [Developer Docs](https://www.mercadopago.com.br/developers)
- [SDK JavaScript](https://www.mercadopago.com.br/developers/pt/docs/sdks-library/client-side/sdk-js)

### PIX
- [Banco Central - PIX](https://www.bcb.gov.br/estabilidadefinanceira/pix)
- [Asaas API](https://docs.asaas.com/)
- [Gerencianet API](https://dev.efipay.com.br/docs)

---

## 🚨 Notas Importantes

1. **Sempre teste em sandbox** antes de produção
2. **Configure webhooks corretamente** (validação de assinatura)
3. **Armazene secrets de forma segura** (Supabase Secrets)
4. **Log tudo** para debugging
5. **Tratamento de erros robusto**
6. **Idempotência** é crucial (evitar duplicatas)
7. **Compliance com PCI-DSS** se manusear cartões
8. **LGPD** - dados de pagamento sensíveis

---

## 📅 Roadmap Sugerido

### Fase 1 (2-3 semanas)
- Stripe básico
- Dashboard de vendas
- Sistema de cupons

### Fase 2 (2-3 semanas)
- Mercado Pago
- PIX nativo
- Checkout otimizado

### Fase 3 (3-4 semanas)
- Sistema de afiliados
- Assinaturas recorrentes
- Analytics avançado

### Fase 4 (Ongoing)
- Internacionalização
- Split de pagamento
- Melhorias contínuas
