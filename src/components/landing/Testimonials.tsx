import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Maria Silva",
    role: "Empreendedora Digital",
    content: "Em apenas 3 meses usando a plataforma, triplicuei meu faturamento com cursos online. A facilidade de uso e o app instalável fizeram toda diferença para meus alunos!",
    rating: 5,
    avatar: "👩‍💼",
    result: "3x mais faturamento",
    verified: true
  },
  {
    name: "João Santos",
    role: "Coach de Negócios",
    content: "Migrei de outra plataforma cara e complicada. Aqui consegui configurar tudo em menos de 1 hora e já vendi mais de R$ 50k nos primeiros 60 dias. Suporte excepcional!",
    rating: 5,
    avatar: "👨‍💻",
    result: "R$ 50k em 60 dias",
    verified: true
  },
  {
    name: "Ana Costa",
    role: "Professora Online",
    content: "A melhor decisão que tomei! Meus 300+ alunos adoram o app no celular. As notificações automáticas aumentaram o engajamento em 80%. Vale cada centavo!",
    rating: 5,
    avatar: "👩‍🏫",
    result: "+80% engajamento",
    verified: true
  }
];

export function Testimonials() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container-app">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Resultados Reais de Quem Usa
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Veja como nossa plataforma está transformando negócios digitais
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="card-hover border-primary/20 relative overflow-hidden">
              {/* Badge de Resultado */}
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                {testimonial.result}
              </div>
              
              <CardContent className="pt-8 pb-6 px-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="text-5xl">{testimonial.avatar}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-lg">{testimonial.name}</h4>
                      {testimonial.verified && (
                        <span className="text-primary" title="Verificado">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
