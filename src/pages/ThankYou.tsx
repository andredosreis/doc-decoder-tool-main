import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Rocket, Mail, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

export default function ThankYou() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "pro";

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="container-app max-w-3xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-2 border-primary/50 shadow-glow-lg">
            <CardContent className="p-8 md:p-12 text-center">
              {/* Ícone de Sucesso */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2, type: "spring" }}
                className="mb-6 inline-block"
              >
                <div className="w-24 h-24 bg-gradient-glow rounded-full flex items-center justify-center mx-auto shadow-glow">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </motion.div>

              {/* Título */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Bem-vindo ao{" "}
                  <span className="text-gradient">APP XPRO!</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Sua conta foi criada com sucesso! 🎉
                </p>
              </motion.div>

              {/* Informações */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="space-y-6 mb-8"
              >
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Mail className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                      <div className="text-left">
                        <h3 className="font-semibold mb-2">
                          Verifique seu email
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Enviamos um email de confirmação para você. Clique no
                          link para ativar sua conta e acessar o painel admin.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-accent/5 border-accent/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Rocket className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                      <div className="text-left">
                        <h3 className="font-semibold mb-2">
                          Próximos Passos
                        </h3>
                        <ul className="text-sm text-muted-foreground space-y-2">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                            Configure seu primeiro produto
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                            Faça upload dos seus módulos
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-accent" />
                            Personalize as cores do seu app
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Button
                  size="lg"
                  className="btn-glow"
                  onClick={() => navigate("/auth/admin-login")}
                >
                  Acessar Painel Admin
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Voltar ao Início
                </Button>
              </motion.div>

              {/* Nota de Rodapé */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="text-sm text-muted-foreground mt-8"
              >
                Precisa de ajuda? Entre em contato com nosso suporte.
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
