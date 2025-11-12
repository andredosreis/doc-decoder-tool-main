import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Eye,
  DollarSign,
  User,
  Package
} from "lucide-react";

interface Purchase {
  id: string;
  created_at: string;
  status: 'pending' | 'approved' | 'cancelled' | 'refunded';
  amount_paid: number | null;
  payment_platform: string | null;
  external_transaction_id: string | null;
  approved_at: string | null;
  user: {
    id: string;
    email: string;
    full_name: string | null;
  };
  product: {
    id: string;
    title: string;
    price: number | null;
  };
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          id,
          created_at,
          status,
          amount_paid,
          payment_platform,
          external_transaction_id,
          approved_at,
          user:profiles!purchases_user_id_fkey (
            id,
            email,
            full_name
          ),
          product:products (
            id,
            title,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar compras:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar compras",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePurchaseStatus = async (
    purchaseId: string, 
    newStatus: 'approved' | 'cancelled' | 'refunded'
  ) => {
    try {
      const updateData: any = {
        status: newStatus,
      };

      if (newStatus === 'approved') {
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('purchases')
        .update(updateData)
        .eq('id', purchaseId);

      if (error) throw error;

      // Enviar email de confirmação se aprovado
      if (newStatus === 'approved') {
        try {
          await supabase.functions.invoke('send-purchase-confirmation', {
            body: { purchaseId }
          });
          console.log('Email de confirmação enviado');
        } catch (emailError) {
          console.error('Erro ao enviar email:', emailError);
          // Não bloqueia a aprovação se o email falhar
        }
      }

      toast({
        title: "Status atualizado",
        description: `Compra ${newStatus === 'approved' ? 'aprovada' : 'atualizada'} com sucesso!`,
      });

      fetchPurchases();
    } catch (error: any) {
      console.error('Erro ao atualizar compra:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock, label: "Pendente" },
      approved: { variant: "default", icon: CheckCircle, label: "Aprovado" },
      cancelled: { variant: "destructive", icon: XCircle, label: "Cancelado" },
      refunded: { variant: "outline", icon: RefreshCw, label: "Reembolsado" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const stats = {
    pending: purchases.filter(p => p.status === 'pending').length,
    approved: purchases.filter(p => p.status === 'approved').length,
    total: purchases.length,
    revenue: purchases
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + (p.amount_paid || p.product.price || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestão de Compras</h2>
        <p className="text-muted-foreground">
          Aprove, cancele ou gerencie todas as compras da plataforma
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.revenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Compras */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Compras</CardTitle>
          <CardDescription>
            Lista completa de todas as transações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma compra registrada ainda</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{purchase.user?.full_name || 'Sem nome'}</p>
                        <p className="text-sm text-muted-foreground">{purchase.user?.email || 'Email não disponível'}</p>
                      </div>
                    </TableCell>
                    <TableCell>{purchase.product.title}</TableCell>
                    <TableCell>
                      R$ {(purchase.amount_paid || purchase.product.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedPurchase(purchase)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Detalhes da Compra</DialogTitle>
                              <DialogDescription>
                                Informações completas da transação
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPurchase && (
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm font-medium">Cliente</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedPurchase.user?.full_name || 'Sem nome'}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedPurchase.user?.email || 'Email não disponível'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Produto</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedPurchase.product.title}
                                  </p>
                                </div>
                                {selectedPurchase.external_transaction_id && (
                                  <div>
                                    <p className="text-sm font-medium">ID da Transação</p>
                                    <p className="text-sm text-muted-foreground font-mono">
                                      {selectedPurchase.external_transaction_id}
                                    </p>
                                  </div>
                                )}
                                {selectedPurchase.payment_platform && (
                                  <div>
                                    <p className="text-sm font-medium">Plataforma</p>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedPurchase.payment_platform}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {purchase.status === 'pending' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => updatePurchaseStatus(purchase.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updatePurchaseStatus(purchase.id, 'cancelled')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Cancelar
                            </Button>
                          </>
                        )}

                        {purchase.status === 'approved' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updatePurchaseStatus(purchase.id, 'refunded')}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Reembolsar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
