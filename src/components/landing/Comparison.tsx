import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export function Comparison() {
  const comparisons = [
    {
      feature: "Custo mensal",
      traditional: "R$ 300-1000/mês",
      ours: "Preço justo e acessível",
    },
    {
      feature: "Tempo de setup",
      traditional: "Dias ou semanas",
      ours: "Menos de 1 hora",
    },
    {
      feature: "Personalização",
      traditional: "Limitada",
      ours: "Total (cores, logo, tema)",
    },
    {
      feature: "App instalável",
      traditional: "Não disponível",
      ours: "PWA incluído",
    },
    {
      feature: "Suporte",
      traditional: "Email (lento)",
      ours: "Direto e rápido",
    },
    {
      feature: "Integrações",
      traditional: "Poucas opções",
      ours: "Hotmart, Kiwify, Stripe...",
    },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container-app">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por Que Escolher Nossa Plataforma?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Compare e veja a diferença
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="hidden md:block"></div>
            <Card className="bg-muted/50">
              <CardHeader className="text-center">
                <CardTitle>Plataformas Tradicionais</CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-primary/10 border-primary">
              <CardHeader className="text-center">
                <CardTitle className="text-primary">Nossa Solução ⭐</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {comparisons.map((item, index) => (
            <div key={index} className="grid md:grid-cols-3 gap-4 mb-3">
              <div className="flex items-center font-semibold text-sm md:text-base px-4">
                {item.feature}
              </div>
              <Card className="bg-muted/50">
                <CardContent className="p-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item.traditional}</span>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">{item.ours}</span>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
