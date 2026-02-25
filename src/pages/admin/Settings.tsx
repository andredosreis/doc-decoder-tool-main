import { useEffect } from "react";
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
