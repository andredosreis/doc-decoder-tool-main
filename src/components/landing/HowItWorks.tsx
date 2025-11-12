import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Crie sua conta",
      description: "Cadastro simples e rápido em apenas 30 segundos",
      time: "30 seg",
      icon: "🚀",
    },
    {
      number: "2",
      title: "Configure seu produto",
      description: "Adicione módulos, vídeos, PDFs e personalize as cores",
      time: "5 min",
      icon: "⚙️",
    },
    {
      number: "3",
      title: "Comece a vender",
      description: "Configure seu webhook de pagamento e está pronto!",
      time: "Instantâneo",
      icon: "💰",
    },
  ];

  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container-app">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como Funciona?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            3 passos simples para ter sua plataforma de cursos no ar
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="card-hover h-full">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="text-6xl mb-4">{step.icon}</div>
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-2">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                  <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                    {step.time}
                  </div>
                </CardContent>
              </Card>
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-8 w-8 text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
