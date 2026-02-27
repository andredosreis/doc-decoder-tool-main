import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Package, Users, DollarSign, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

async function fetchDashboardStats(adminId: string) {
  // 1. Total de produtos
  const { count: productCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('admin_id', adminId);

  // 2. IDs dos produtos deste admin
  const { data: products } = await supabase
    .from('products')
    .select('id')
    .eq('admin_id', adminId);

  const productIds = products?.map(p => p.id) ?? [];

  if (productIds.length === 0) {
    return { productCount: productCount ?? 0, activeStudents: 0, monthlyRevenue: 0, completionRate: 0, recentPurchases: [] };
  }

  // 3. Alunos ativos (distinct user_id com compras aprovadas)
  const { data: purchasesForStudents } = await supabase
    .from('purchases')
    .select('user_id')
    .in('product_id', productIds)
    .eq('status', 'approved');

  const activeStudents = new Set(purchasesForStudents?.map(p => p.user_id)).size;

  // 4. Receita do mês
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthlyPurchases } = await supabase
    .from('purchases')
    .select('amount_paid')
    .in('product_id', productIds)
    .eq('status', 'approved')
    .gte('approved_at', startOfMonth.toISOString());

  const monthlyRevenue = monthlyPurchases?.reduce((sum, p) => sum + (p.amount_paid ?? 0), 0) ?? 0;

  // 5. Taxa de conclusão média
  const { data: modules } = await supabase
    .from('modules')
    .select('id')
    .in('product_id', productIds);

  const moduleIds = modules?.map(m => m.id) ?? [];
  let completionRate = 0;

  if (moduleIds.length > 0) {
    const { data: progress } = await supabase
      .from('user_progress')
      .select('progress_percentage')
      .in('module_id', moduleIds);

    if (progress && progress.length > 0) {
      completionRate = progress.reduce((sum, p) => sum + (p.progress_percentage ?? 0), 0) / progress.length;
    }
  }

  // 6. Progresso médio por curso
  const { data: productsWithTitle } = await supabase
    .from('products')
    .select('id, title')
    .eq('admin_id', adminId);

  const courseEngagement = await Promise.all(
    (productsWithTitle ?? []).map(async (product) => {
      const { data: productModules } = await supabase
        .from('modules')
        .select('id')
        .eq('product_id', product.id);

      const modIds = productModules?.map(m => m.id) ?? [];
      if (modIds.length === 0) return { title: product.title, avgProgress: 0, totalStudents: 0 };

      const { data: progress } = await supabase
        .from('user_progress')
        .select('progress_percentage, user_id')
        .in('module_id', modIds);

      const totalStudents = new Set(progress?.map(p => p.user_id)).size;
      const avgProgress = progress && progress.length > 0
        ? progress.reduce((sum, p) => sum + (p.progress_percentage ?? 0), 0) / progress.length
        : 0;

      return { title: product.title, avgProgress: Math.round(avgProgress), totalStudents };
    })
  );

  // 7. Atividade recente (últimas 5 compras)
  const { data: recentPurchases } = await supabase
    .from('purchases')
    .select(`
      id,
      amount_paid,
      status,
      created_at,
      user:profiles!purchases_user_id_fkey(full_name, email),
      product:products(title)
    `)
    .in('product_id', productIds)
    .order('created_at', { ascending: false })
    .limit(5);

  return {
    productCount: productCount ?? 0,
    activeStudents,
    monthlyRevenue,
    completionRate,
    courseEngagement,
    recentPurchases: recentPurchases ?? [],
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: () => fetchDashboardStats(user!.id),
    enabled: !!user,
  });

  const statCards = [
    {
      title: "Total de Produtos",
      value: isLoading ? null : String(stats?.productCount ?? 0),
      description: "Produtos cadastrados",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Clientes Ativos",
      value: isLoading ? null : String(stats?.activeStudents ?? 0),
      description: "Usuários com acesso",
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Vendas do Mês",
      value: isLoading ? null : `R$ ${(stats?.monthlyRevenue ?? 0).toFixed(2)}`,
      description: "Faturamento atual",
      icon: DollarSign,
      color: "text-yellow-600",
      bg: "bg-yellow-50",
    },
    {
      title: "Taxa de Conclusão",
      value: isLoading ? null : `${Math.round(stats?.completionRate ?? 0)}%`,
      description: "Média de progresso",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral da sua plataforma de cursos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {stat.value === null ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <div className="text-2xl font-bold">{stat.value}</div>
                )}
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Engajamento por curso */}
      {!isLoading && stats?.courseEngagement && stats.courseEngagement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Engajamento por Curso</CardTitle>
            <CardDescription>Média de progresso dos alunos em cada curso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {stats.courseEngagement.map((course) => (
              <div key={course.title} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate max-w-[60%]">{course.title}</span>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{course.totalStudents} aluno{course.totalStudents !== 1 ? 's' : ''}</span>
                    <span className="font-semibold text-foreground">{course.avgProgress}%</span>
                  </div>
                </div>
                <Progress value={course.avgProgress} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bem-vindo!</CardTitle>
            <CardDescription>
              Configure sua plataforma em poucos passos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <h4 className="font-medium">Criar um Produto</h4>
                <p className="text-sm text-muted-foreground">
                  Adicione seu primeiro produto
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <h4 className="font-medium">Upload de Conteúdo</h4>
                <p className="text-sm text-muted-foreground">
                  Faça upload de vídeos e PDFs
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <h4 className="font-medium">Configurar Pagamentos</h4>
                <p className="text-sm text-muted-foreground">
                  Integre com Hotmart, Kiwify, etc
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>
              Últimas compras na plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stats?.recentPurchases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma atividade ainda</p>
                <p className="text-sm mt-2">
                  Comece criando seu primeiro produto!
                </p>
              </div>
            ) : (
              <ul className="divide-y">
                {stats?.recentPurchases.map((purchase: any) => (
                  <li key={purchase.id} className="py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {purchase.user?.full_name || purchase.user?.email || 'Usuário'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {purchase.product?.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        R$ {(purchase.amount_paid ?? 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {purchase.status}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
