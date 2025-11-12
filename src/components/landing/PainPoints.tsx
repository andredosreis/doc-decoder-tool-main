import { Card, CardContent } from "@/components/ui/card";
import { XCircle, CheckCircle2 } from "lucide-react";

export function PainPoints() {
  const problems = [
    "Plataformas caras e com mensalidades abusivas?",
    "Perdendo tempo tentando configurar tecnologia?",
    "Difícil gerenciar alunos e conteúdo?",
    "Sem controle sobre a aparência da sua marca?",
  ];

  const solutions = [
    "Preço justo e transparente, sem surpresas",
    "Configure sua plataforma em menos de 1 hora",
    "Dashboard intuitivo para gerenciar tudo",
    "Personalize cores, logo e tema por produto",
  ];

  return (
    <section className="py-20 px-4">
      <div className="container-app">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cansado de Plataformas Complicadas?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Nós entendemos suas dores. É por isso que criamos uma solução simples e poderosa.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Problemas */}
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-destructive">❌ Problemas Comuns</h3>
              <div className="space-y-4">
                {problems.map((problem, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{problem}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Soluções */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-primary">✅ Nossa Solução</h3>
              <div className="space-y-4">
                {solutions.map((solution, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-muted-foreground">{solution}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
