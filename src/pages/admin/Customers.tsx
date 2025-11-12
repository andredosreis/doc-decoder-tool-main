import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function AdminCustomers() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Gerencie seus clientes e acessos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nenhum cliente cadastrado</CardTitle>
          <CardDescription>
            Os clientes aparecerão aqui após as primeiras vendas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Users className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Configure os webhooks de pagamento para<br />
            sincronizar automaticamente suas vendas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
