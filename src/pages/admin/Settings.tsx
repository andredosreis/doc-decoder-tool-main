import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Configure sua plataforma
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Plataforma</CardTitle>
          <CardDescription>
            Configure o nome e aparência da sua plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform-name">Nome da Plataforma</Label>
            <Input 
              id="platform-name" 
              placeholder="Minha Plataforma"
              defaultValue="Minha Plataforma"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="support-email">Email de Suporte</Label>
            <Input 
              id="support-email" 
              type="email"
              placeholder="suporte@minhaplatforma.com"
            />
          </div>

          <Button>Salvar Alterações</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrações de Pagamento</CardTitle>
          <CardDescription>
            Configure webhooks para Hotmart, Kiwify, etc
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook Hotmart</Label>
            <Input 
              readOnly
              value="https://seu-projeto.supabase.co/functions/v1/payment-webhook?platform=hotmart"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Copie esta URL e configure no painel da Hotmart
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Webhook Kiwify</Label>
            <Input 
              readOnly
              value="https://seu-projeto.supabase.co/functions/v1/payment-webhook?platform=kiwify"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Copie esta URL e configure no painel da Kiwify
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
