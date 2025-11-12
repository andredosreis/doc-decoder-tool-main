import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      toast({
        title: "Erro",
        description: "Sessão de pagamento não encontrada",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Processar pagamento automaticamente
    handleProcessPayment();
  }, [sessionId]);

  const handleProcessPayment = async () => {
    try {
      console.log("Processando criação de conta para sessão:", sessionId);

      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          sessionId,
        },
      });

      if (error) throw error;

      console.log("Conta criada com sucesso:", data);

      toast({
        title: "Conta criada com sucesso!",
        description: "Você será redirecionado para o login...",
      });

      setProcessing(false);

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao criar conta:", error);
      setError(error.message || "Erro ao processar pagamento");
      setProcessing(false);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Entre em contato com o suporte",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-2 border-primary/50 shadow-glow">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                {processing ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : error ? (
                  <div className="h-8 w-8 text-destructive">✕</div>
                ) : (
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                )}
              </div>
              
              <h1 className="text-3xl font-bold mb-2">
                {processing ? "Processando Pagamento..." : error ? "Erro no Processamento" : "Pagamento Confirmado!"}
              </h1>
              
              <p className="text-muted-foreground mb-6">
                {processing 
                  ? "Estamos criando sua conta e configurando seu acesso..." 
                  : error 
                  ? error
                  : "Sua conta foi criada com sucesso! Você será redirecionado para o login."}
              </p>

              {processing && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span>Validando pagamento</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <span>Criando sua conta</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0.4s" }} />
                    <span>Configurando permissões</span>
                  </div>
                </div>
              )}

              {error && (
                <Button
                  onClick={() => navigate("/")}
                  size="lg"
                  variant="outline"
                  className="w-full mt-6"
                >
                  Voltar ao Início
                </Button>
              )}

              {!processing && !error && (
                <Button
                  onClick={() => navigate("/login")}
                  size="lg"
                  className="w-full btn-glow"
                >
                  Ir para Login
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
