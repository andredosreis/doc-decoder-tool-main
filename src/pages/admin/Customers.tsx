import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Customer {
  id: string;
  full_name: string | null;
  email: string;
  total_courses: number;
  last_purchase: string | null;
}

async function fetchCustomers(adminId: string): Promise<Customer[]> {
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('admin_id', adminId);

  const productIds = products?.map(p => p.id) ?? [];
  if (productIds.length === 0) return [];

  const { data: purchases, error } = await supabase
    .from('purchases')
    .select(`
      user_id,
      approved_at,
      user:profiles!purchases_user_id_fkey(id, full_name, email)
    `)
    .in('product_id', productIds)
    .eq('status', 'approved')
    .order('approved_at', { ascending: false });

  if (error) throw error;

  // Aggregate by user
  const customerMap = new Map<string, Customer>();
  for (const purchase of purchases ?? []) {
    const profile = purchase.user as any;
    if (!profile) continue;
    const existing = customerMap.get(profile.id);
    if (existing) {
      existing.total_courses += 1;
    } else {
      customerMap.set(profile.id, {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        total_courses: 1,
        last_purchase: purchase.approved_at,
      });
    }
  }

  return Array.from(customerMap.values());
}

export default function AdminCustomers() {
  const { user } = useAuth();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['admin-customers', user?.id],
    queryFn: () => fetchCustomers(user!.id),
    enabled: !!user,
  });

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
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Clientes com compras aprovadas nos seus produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !customers || customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum cliente ainda.<br />
                Os clientes aparecerão aqui após as primeiras vendas aprovadas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 pr-4 font-medium">Nome</th>
                    <th className="text-left py-3 pr-4 font-medium">Email</th>
                    <th className="text-left py-3 pr-4 font-medium">Cursos</th>
                    <th className="text-left py-3 font-medium">Última Compra</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 pr-4 font-medium">
                        {customer.full_name || '—'}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {customer.email}
                      </td>
                      <td className="py-3 pr-4">
                        {customer.total_courses}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {customer.last_purchase
                          ? new Date(customer.last_purchase).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
