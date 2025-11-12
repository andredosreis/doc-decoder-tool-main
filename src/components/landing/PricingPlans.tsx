import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function PricingPlans() {
  const navigate = useNavigate();
  const [students, setStudents] = useState(100);

  const plans = [
    {
      name: "Iniciante",
      price: "39",
      description: "Ideal para começar",
      features: [
        "1 app PWA",
        "Upload ilimitado",
        "Analytics básico",
        "Suporte por email",
        "SSL incluso",
      ],
      cta: "Começar Agora",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "89",
      description: "Para produtores sérios",
      features: [
        "5 apps PWA",
        "Push notifications",
        "Analytics avançado",
        "Domínio próprio",
        "Suporte prioritário",
        "White label",
      ],
      cta: "Escolher Pro",
      highlighted: true,
      badge: "Mais Popular",
    },
    {
      name: "Enterprise",
      price: "Customizado",
      description: "Para grandes operações",
      features: [
        "Apps ilimitados",
        "API completa",
        "Infra dedicada",
        "Gerente de conta",
        "SLA garantido",
        "Customizações",
      ],
      cta: "Falar com Vendas",
      highlighted: false,
    },
  ];

  const calculateROI = (students: number) => {
    const engagementIncrease = students * 2; // 2x mais tempo de leitura
    const retentionIncrease = students * 1.5; // 50% mais retenção
    return {
      engagement: engagementIncrease,
      retention: Math.round(retentionIncrease),
    };
  };

  const roi = calculateROI(students);

  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Planos Para Cada Momento do Seu Negócio
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Escolha o plano ideal para o tamanho da sua operação
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={plan.highlighted ? "md:-mt-4" : ""}
            >
              <Card
                className={`h-full relative ${
                  plan.highlighted
                    ? "border-primary border-2 shadow-2xl"
                    : "border-border"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-white px-4 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  <div className="mb-6 text-center">
                    {plan.price === "Customizado" ? (
                      <span className="text-4xl font-bold">{plan.price}</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">
                          R${plan.price}
                        </span>
                        <span className="text-muted-foreground">/mês</span>
                      </>
                    )}
                  </div>
                  <Button
                    size="lg"
                    className={`w-full mb-6 ${
                      plan.highlighted ? "btn-glow" : ""
                    }`}
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => {
                      const planName = plan.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      navigate(`/checkout?plan=${planName}`);
                    }}
                  >
                    {plan.cta}
                  </Button>
                  <div className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* ROI Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="max-w-3xl mx-auto border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">
                📊 Calculadora de ROI
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantos alunos/clientes usarão seu app por mês?
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={students}
                    onChange={(e) => setStudents(Number(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-center text-2xl font-bold text-primary mt-2">
                    {students} alunos
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-primary/5">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-primary mb-2">
                        {roi.engagement}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Mais minutos de engajamento
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5">
                    <CardContent className="p-6 text-center">
                      <p className="text-3xl font-bold text-primary mb-2">
                        {roi.retention}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Alunos com mais retenção
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <p className="text-center text-muted-foreground text-sm">
                  * Baseado em métricas médias dos nossos clientes
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
