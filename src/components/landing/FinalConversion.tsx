import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield, ArrowRight } from "lucide-react";
import { CountdownTimer } from "./CountdownTimer";
import { TrustBadges } from "./TrustBadges";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function FinalConversion() {
  const navigate = useNavigate();
  
  const bonuses = [
    "Setup personalizado grátis (valor R$ 497)",
    "Suporte prioritário por 30 dias",
    "Templates de conteúdo prontos",
    "Guia completo de conversão",
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-subtle pointer-events-none" />
      
      <div className="container-app relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-card/95 backdrop-blur-md border-primary/30 shadow-glow-lg overflow-hidden">
            <CardContent className="p-12 text-center space-y-8">
              <Badge className="bg-primary/20 text-primary border-primary/30">
                Oferta Exclusiva Para os Primeiros 100
              </Badge>

              <h2 className="text-3xl md:text-5xl font-bold text-foreground">
                Transforme Seu Conteúdo Hoje <br />
                E Revolucione Sua Entrega
              </h2>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Configure seu primeiro app PWA em menos de 5 minutos e comece a impressionar seus clientes hoje mesmo
              </p>

              {/* Countdown Timer */}
              <div className="py-6">
                <p className="text-sm mb-4 text-muted-foreground">Esta oferta expira em:</p>
                <CountdownTimer hours={24} />
              </div>

              {/* Bônus */}
              <div className="bg-primary/5 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto border border-primary/10">
                <h3 className="text-2xl font-bold mb-6 text-foreground">Bônus Inclusos Hoje:</h3>
                <div className="grid md:grid-cols-2 gap-4 text-left">
                  {bonuses.map((bonus, index) => (
                    <div key={index} className="flex items-center gap-3 text-foreground">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary" />
                      <span className="text-sm">{bonus}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Principal */}
              <Button
                size="lg"
                onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-6 text-lg px-12 py-6 bg-gradient-primary text-white hover:opacity-90 hover:scale-105 transition-all shadow-glow border-0"
              >
                Criar Meu Primeiro App Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-sm text-muted-foreground">
                Garantia de 7 dias • Sem pegadinhas • Cancele quando quiser
              </p>

              {/* Trust Badges */}
              <TrustBadges />

              {/* Garantia */}
              <div className="pt-6">
                <div className="inline-flex items-center gap-3 bg-primary/10 backdrop-blur-sm rounded-full px-6 py-3 border border-primary/20">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    Garantia de 7 dias ou seu dinheiro de volta - sem perguntas
                  </span>
                </div>
              </div>

              {/* Urgência Final */}
              <div className="pt-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Apenas <strong className="text-primary">37 vagas restantes</strong> para o setup gratuito
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
