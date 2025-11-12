import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Lock, CreditCard, Shield } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "pro";
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [step, setStep] = useState<"info" | "processing">("info");

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push("Mínimo 8 caracteres");
    if (!/[A-Z]/.test(password)) errors.push("Uma letra maiúscula");
    if (!/[a-z]/.test(password)) errors.push("Uma letra minúscula");
    if (!/[0-9]/.test(password)) errors.push("Um número");
    return errors;
  };

  

  const plans = {
    iniciante: {
      name: "Iniciante",
      price: "39",
      features: [
        "1 app PWA",
        "Upload ilimitado",
        "Analytics básico",
        "Suporte por email",
        "SSL incluso",
      ],
      badge: undefined,
    },
    pro: {
      name: "Pro",
      price: "89",
      features: [
        "5 apps PWA",
        "Push notifications",
        "Analytics avançado",
        "Domínio próprio",
        "Suporte prioritário",
        "White label",
      ],
      badge: "Mais Popular",
    },
    enterprise: {
      name: "Enterprise",
      price: "Customizado",
      features: [
        "Apps ilimitados",
        "API completa",
        "Infra dedicada",
        "Gerente de conta",
        "SLA garantido",
        "Customizações",
      ],
      badge: undefined,
    },
  };

  const currentPlan = plans[selectedPlan as keyof typeof plans] || plans.pro;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar senha
    const errors = validatePassword(formData.password);
    if (errors.length > 0) {
      setPasswordErrors(errors);
      toast({
        title: "Senha inválida",
        description: "Por favor, corrija os erros na senha",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas devem ser iguais",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setStep("processing");

    try {
      console.log("Iniciando checkout para o plano:", selectedPlan);
      
      // Create checkout session with Stripe, passing password in metadata
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          plan: selectedPlan,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        },
      });

      console.log("Resposta do create-checkout:", { data, error });

      if (error) {
        console.error("Erro retornado pela função:", error);
        throw error;
      }

      if (data?.url) {
        console.log("Redirecionando para Stripe checkout:", data.url);
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        console.error("URL não encontrada na resposta:", data);
        throw new Error("Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Erro no checkout:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
      setLoading(false);
      setStep("info");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container-app py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gradient">APP XPRO</h1>
            <Button variant="ghost" onClick={() => navigate("/")}>
              Voltar
            </Button>
          </div>
        </div>
      </header>

      <div className="container-app py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Finalize Sua Compra
            </h2>
            <p className="text-lg text-muted-foreground">
              Crie sua conta e comece a transformar seus PDFs em apps
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Formulário de Cadastro */}
            <div>
              <Card className="border-2">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">Criar Conta</h3>
                    <p className="text-muted-foreground">
                      Preencha os dados para começar
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Seu nome completo"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData({ ...formData, fullName: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 8 caracteres"
                        value={formData.password}
                        onChange={(e) => {
                          const newPassword = e.target.value;
                          setFormData({ ...formData, password: newPassword });
                          if (newPassword) {
                            setPasswordErrors(validatePassword(newPassword));
                          } else {
                            setPasswordErrors([]);
                          }
                        }}
                        required
                      />
                      {passwordErrors.length > 0 && formData.password && (
                        <div className="mt-2 space-y-1">
                          {passwordErrors.map((error, idx) => (
                            <p key={idx} className="text-xs text-destructive flex items-center gap-1">
                              <span>•</span> {error}
                            </p>
                          ))}
                        </div>
                      )}
                      {formData.password && passwordErrors.length === 0 && (
                        <p className="mt-2 text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Senha forte
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Digite a senha novamente"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          setFormData({ ...formData, confirmPassword: e.target.value })
                        }
                        required
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="mt-2 text-xs text-destructive">
                          As senhas não coincidem
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full btn-glow"
                      disabled={loading || passwordErrors.length > 0 || !formData.password || formData.password !== formData.confirmPassword}
                    >
                      {loading ? (
                        step === "processing" ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                            Processando pagamento...
                          </>
                        ) : (
                          "Processando..."
                        )
                      ) : (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Ir para Pagamento
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Pagamento 100% seguro</span>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Resumo do Plano */}
            <div>
              <Card className="border-2 border-primary/50 shadow-glow sticky top-24">
                <CardContent className="p-8">
                  <div className="mb-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                        {currentPlan.badge && (
                          <Badge className="mt-2">{currentPlan.badge}</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">
                          {currentPlan.price !== "Customizado" && "R$"}
                          {currentPlan.price}
                        </div>
                        {currentPlan.price !== "Customizado" && (
                          <div className="text-sm text-muted-foreground">/mês</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold">Incluído no plano:</h4>
                    {currentPlan.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span>Aceita todos os cartões</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>Garantia de 7 dias</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4 text-primary" />
                      <span>Dados criptografados</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-center">
                      🎁 <strong>Bônus:</strong> Acesso imediato ao painel admin
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
