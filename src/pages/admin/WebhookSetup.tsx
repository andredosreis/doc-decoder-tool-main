import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Copy, Check, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function WebhookSetup() {
  const [copied, setCopied] = useState(false);
  
  // URL do webhook (você pode pegar da env ou usar a URL do projeto)
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-payment`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    toast({
      title: "URL Copiada!",
      description: "Cole na configuração da plataforma de pagamento",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const examplePayloads = {
    hotmart: `{
  "platform": "hotmart",
  "event": "purchase.approved",
  "external_product_id": "seu-produto-id",
  "customer_email": "cliente@email.com",
  "customer_name": "Nome do Cliente",
  "transaction_id": "TRANS123456",
  "amount": 197.00,
  "status": "approved"
}`,
    kiwify: `{
  "platform": "kiwify",
  "event": "order.paid",
  "external_product_id": "seu-produto-id",
  "customer_email": "cliente@email.com",
  "customer_name": "Nome do Cliente",
  "transaction_id": "KW123456",
  "amount": 197.00,
  "status": "approved"
}`,
    monetizze: `{
  "platform": "monetizze",
  "event": "sale.approved",
  "external_product_id": "seu-produto-id",
  "customer_email": "cliente@email.com",
  "customer_name": "Nome do Cliente",
  "transaction_id": "MZ123456",
  "amount": 197.00,
  "status": "approved"
}`
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuração de Webhooks</h2>
        <p className="text-muted-foreground">
          Configure webhooks para automatizar aprovações de compras
        </p>
      </div>

      {/* URL do Webhook */}
      <Card>
        <CardHeader>
          <CardTitle>URL do Webhook</CardTitle>
          <CardDescription>
            Use esta URL nas configurações de webhook da sua plataforma de pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={webhookUrl}
              readOnly
              className="font-mono text-sm"
            />
            <Button 
              variant="outline" 
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex gap-2 items-start">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Como configurar:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Copie a URL acima</li>
                  <li>Acesse as configurações de webhook da sua plataforma</li>
                  <li>Cole a URL e configure para POST</li>
                  <li>Certifique-se de enviar o product_id correto no payload</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração por Plataforma */}
      <Card>
        <CardHeader>
          <CardTitle>Plataformas Suportadas</CardTitle>
          <CardDescription>
            Exemplos de configuração para as principais plataformas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hotmart */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Hotmart</h3>
              <Badge variant="secondary">POST</Badge>
            </div>
            <div className="space-y-2">
              <Label>Exemplo de Payload:</Label>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {examplePayloads.hotmart}
              </pre>
            </div>
          </div>

          {/* Kiwify */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Kiwify</h3>
              <Badge variant="secondary">POST</Badge>
            </div>
            <div className="space-y-2">
              <Label>Exemplo de Payload:</Label>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {examplePayloads.kiwify}
              </pre>
            </div>
          </div>

          {/* Monetizze */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Monetizze</h3>
              <Badge variant="secondary">POST</Badge>
            </div>
            <div className="space-y-2">
              <Label>Exemplo de Payload:</Label>
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {examplePayloads.monetizze}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campos Obrigatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Campos Obrigatórios</CardTitle>
          <CardDescription>
            Certifique-se de que o webhook envia estes campos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="font-medium text-sm">customer_email</p>
              <p className="text-sm text-muted-foreground">Email do cliente</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm">transaction_id</p>
              <p className="text-sm text-muted-foreground">ID único da transação</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm">external_product_id</p>
              <p className="text-sm text-muted-foreground">ID do produto na plataforma</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium text-sm">status</p>
              <p className="text-sm text-muted-foreground">approved | pending | cancelled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
