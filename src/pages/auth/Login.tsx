/**
 * 🔐 PÁGINA DE LOGIN
 * 
 * Esta é a página onde usuários e admins fazem login.
 * ONDE MUDAR: Personalizar logo, textos, validações
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ONDE MUDAR: Adicionar validações personalizadas
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha email e senha.",
      });
      return;
    }

    setLoading(true);

    try {
      // Autenticar com Supabase
      // ALTERNATIVA: Se usar outro banco, substituir esta chamada
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Verificar a role real do usuário para redirecionar corretamente
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (roleData?.role === 'user') {
          toast({
            title: "Login realizado!",
            description: "Redirecionando para sua área de cursos...",
          });
          navigate("/student", { replace: true });
        } else {
          toast({
            title: "Login realizado!",
            description: "Redirecionando...",
          });
          navigate("/admin/dashboard", { replace: true });
        }
      }
    } catch (error: any) {
      console.error("Erro no login:", error);

      const isEmailNotConfirmed =
        error.message?.toLowerCase().includes("email not confirmed") ||
        error.message?.toLowerCase().includes("not confirmed");

      toast({
        variant: "destructive",
        title: isEmailNotConfirmed ? "Email não confirmado" : "Erro ao fazer login",
        description: isEmailNotConfirmed
          ? "Confirme seu email antes de acessar. Verifique sua caixa de entrada e clique no link que enviamos."
          : error.message || "Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-muted/10 p-4">
      <Card className="w-full max-w-md border-destructive/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Logo size={48} variant="full" />
          </div>

          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-destructive to-destructive/60 bg-clip-text text-transparent">
            Área Administrativa
          </CardTitle>
          <CardDescription className="text-base">
            Acesso restrito para administradores
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {/* Campo de Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Campo de Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Link de Recuperação de Senha */}
            {/* ONDE MUDAR: Implementar recuperação de senha */}
            <div className="text-right">
              <Link 
                to="/auth/forgot-password" 
                className="text-sm text-primary hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-destructive hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Acessar Painel Admin"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Ainda não tem conta?{" "}
              <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                Criar conta de admin
              </Link>
            </p>

            <Link to="/" className="w-full">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para página inicial
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
