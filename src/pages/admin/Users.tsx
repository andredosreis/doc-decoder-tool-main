import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { UserPlus, Users, Mail, Info } from "lucide-react";

interface Student {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  total_courses: number;
}

async function fetchStudents(adminId: string): Promise<Student[]> {
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("admin_id", adminId);

  const productIds = products?.map((p) => p.id) ?? [];
  if (productIds.length === 0) return [];

  const { data: purchases, error } = await supabase
    .from("purchases")
    .select(`
      user_id,
      product_id,
      user:profiles!purchases_user_id_fkey(id, full_name, email, created_at)
    `)
    .in("product_id", productIds)
    .eq("status", "approved");

  if (error) throw error;

  const studentMap = new Map<string, Student>();
  for (const purchase of purchases ?? []) {
    const profile = purchase.user as any;
    if (!profile) continue;
    const existing = studentMap.get(profile.id);
    if (existing) {
      existing.total_courses += 1;
    } else {
      studentMap.set(profile.id, {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        created_at: profile.created_at,
        total_courses: 1,
      });
    }
  }

  return Array.from(studentMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

async function fetchProducts(adminId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("id, title")
    .eq("admin_id", adminId)
    .eq("is_active", true)
    .order("title");
  if (error) throw error;
  return data ?? [];
}

export default function AdminUsers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", product_id: "" });

  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students", user?.id],
    queryFn: () => fetchStudents(user!.id),
    enabled: !!user,
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products-list", user?.id],
    queryFn: () => fetchProducts(user!.id),
    enabled: !!user,
  });

  const inviteMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await supabase.functions.invoke("admin-invite-student", {
        body: {
          email: payload.email,
          full_name: payload.full_name,
          product_id: payload.product_id || undefined,
        },
      });

      // Tentar extrair mensagem de erro real do corpo da resposta
      if (res.error) {
        let detail = res.error.message;
        try {
          const body = await (res.error as any).context?.json?.();
          if (body?.error) detail = body.error;
        } catch (_) {}
        throw new Error(detail);
      }

      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Convite enviado!",
        description: `Um email foi enviado para ${form.email} com o link de acesso.`,
      });
      setForm({ email: "", full_name: "", product_id: "" });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao convidar aluno",
        description: error.message,
      });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) {
      toast({ variant: "destructive", title: "Email é obrigatório" });
      return;
    }
    inviteMutation.mutate(form);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alunos</h1>
          <p className="text-muted-foreground">
            Gerencie os alunos com acesso aos seus cursos
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar Aluno</DialogTitle>
              <DialogDescription>
                O aluno receberá um email com o link para criar a senha e acessar a plataforma.
                O email precisará ser confirmado antes do primeiro acesso.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleInvite} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Nome completo</Label>
                <Input
                  id="invite-name"
                  placeholder="Nome do aluno"
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  disabled={inviteMutation.isPending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-email">Email *</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="aluno@email.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  disabled={inviteMutation.isPending}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-product">Liberar acesso ao curso (opcional)</Label>
                <Select
                  value={form.product_id}
                  onValueChange={(v) => setForm((f) => ({ ...f, product_id: v === "none" ? "" : v }))}
                  disabled={inviteMutation.isPending}
                >
                  <SelectTrigger id="invite-product">
                    <SelectValue placeholder="Selecione um curso..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (só convidar)</SelectItem>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={inviteMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  <Mail className="h-4 w-4 mr-2" />
                  {inviteMutation.isPending ? "Enviando..." : "Enviar Convite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Aviso temporário — remover após configurar SMTP com domínio próprio */}
      <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="space-y-2">
          <p className="font-medium">Convite por email indisponível temporariamente</p>
          <p>Para adicionar um aluno manualmente enquanto o SMTP não está configurado:</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-700">
            <li>
              Acesse o{" "}
              <a
                href="https://supabase.com/dashboard/project/qdaorpyedwpcaaezsaxp/auth/users"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                Supabase → Authentication → Users
              </a>
              {" "}→ <strong>Add user</strong> → preencha email + senha → marque <strong>"Auto Confirm User"</strong>
            </li>
            <li>Copie o ID do usuário criado</li>
            <li>
              Acesse o{" "}
              <a
                href="https://supabase.com/dashboard/project/qdaorpyedwpcaaezsaxp/editor"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                SQL Editor
              </a>
              {" "}e execute:
            </li>
          </ol>
          <pre className="mt-1 rounded bg-amber-100 px-3 py-2 text-xs font-mono text-amber-900 overflow-x-auto">
{`INSERT INTO purchases (user_id, product_id, status, amount_paid, approved_at)
VALUES ('<id_do_aluno>', '<id_do_produto>', 'approved', 0, now());`}
          </pre>
          <p className="text-amber-600 text-xs">
            Este aviso desaparece automaticamente quando você configurar um domínio próprio no Resend e habilitar o SMTP personalizado no Supabase.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
          <CardDescription>
            Alunos com acesso aprovado em pelo menos um dos seus cursos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !students || students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Nenhum aluno ainda.<br />
                Convide um aluno ou aguarde as primeiras compras aprovadas.
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
                    <th className="text-left py-3 font-medium">Desde</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-3 pr-4 font-medium">
                        {student.full_name || (
                          <span className="text-muted-foreground italic">Sem nome</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {student.email}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary">{student.total_courses}</Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {student.created_at
                          ? new Date(student.created_at).toLocaleDateString("pt-BR")
                          : "—"}
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
