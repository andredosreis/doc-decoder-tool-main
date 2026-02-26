import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";

interface SettingsFormData {
  platform_name: string;
  support_email: string;
}

async function fetchSettings(userId: string): Promise<SettingsFormData> {
  const { data, error } = await supabase
    .from('profiles')
    .select('platform_name, support_email')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return {
    platform_name: (data as any)?.platform_name ?? '',
    support_email: (data as any)?.support_email ?? '',
  };
}

async function saveSettings(userId: string, values: SettingsFormData) {
  const { error } = await supabase
    .from('profiles')
    .update({ platform_name: values.platform_name, support_email: values.support_email } as any)
    .eq('id', userId);

  if (error) throw error;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({ variant: "destructive", title: "Senhas não conferem", description: "A nova senha e a confirmação precisam ser iguais." });
      return;
    }

    if (passwordForm.new_password.length < 6) {
      toast({ variant: "destructive", title: "Senha muito curta", description: "A nova senha deve ter pelo menos 6 caracteres." });
      return;
    }

    setPasswordLoading(true);
    try {
      // Reautenticar com a senha atual para validar antes de trocar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: passwordForm.current_password,
      });

      if (signInError) {
        toast({ variant: "destructive", title: "Senha atual incorreta", description: "Verifique sua senha atual e tente novamente." });
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: passwordForm.new_password });
      if (error) throw error;

      toast({ title: "Senha alterada!", description: "Sua senha foi atualizada com sucesso." });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao alterar senha", description: error.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings', user?.id],
    queryFn: () => fetchSettings(user!.id),
    enabled: !!user,
  });

  const { register, handleSubmit, reset } = useForm<SettingsFormData>({
    defaultValues: { platform_name: '', support_email: '' },
  });

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const mutation = useMutation({
    mutationFn: (values: SettingsFormData) => saveSettings(user!.id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings', user?.id] });
      toast({ title: "Configurações salvas", description: "As alterações foram salvas com sucesso." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    },
  });

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
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Nome da Plataforma</Label>
                <Input
                  id="platform-name"
                  placeholder="Minha Plataforma"
                  {...register("platform_name")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">Email de Suporte</Label>
                <Input
                  id="support-email"
                  type="email"
                  placeholder="suporte@minhaplatforma.com"
                  {...register("support_email")}
                />
              </div>

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
          <CardDescription>
            Para sua segurança, confirme a senha atual antes de definir uma nova
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label htmlFor="current-password">Senha atual</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))}
                disabled={passwordLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Nova senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))}
                disabled={passwordLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Digite a nova senha novamente"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))}
                disabled={passwordLoading}
                required
              />
            </div>

            <Button type="submit" disabled={passwordLoading}>
              {passwordLoading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
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
