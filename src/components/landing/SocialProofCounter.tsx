import { Card, CardContent } from "@/components/ui/card";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { TrendingUp, Rocket, Target } from "lucide-react";

export function SocialProofCounter() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const testimonials = [
    {
      name: "Lucas Martins",
      role: "Creator de Finanças",
      result: "Dobrou o tempo médio de leitura",
      quote: "Transformei meu e-book de finanças em um app e o engajamento explodiu. Os alunos agora passam 2x mais tempo consumindo o conteúdo.",
      icon: TrendingUp,
    },
    {
      name: "Ana Silva",
      role: "Coach de Negócios",
      result: "+150% em retenção",
      quote: "Meus playbooks agora parecem produtos premium. O app instalável dá uma credibilidade que PDF nunca teve.",
      icon: Rocket,
    },
    {
      name: "Pedro Santos",
      role: "Educador Online",
      result: "Zero pirataria",
      quote: "Finalmente consigo controlar quem acessa meu conteúdo. E ainda recebo analytics de cada leitor.",
      icon: Target,
    },
  ];

  return (
    <section className="py-20 px-4 bg-secondary/30" ref={ref}>
      <div className="container-app">
        {/* Stats Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Card className="max-w-3xl mx-auto border-primary/20 bg-gradient-primary text-white border-0 shadow-2xl">
            <CardContent className="p-12">
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <div className="text-5xl font-bold mb-2">
                    {inView && <CountUp end={2174} duration={2.5} separator="." />}
                  </div>
                  <p className="text-white/80">Apps criados nos últimos 30 dias</p>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2">
                    {inView && <CountUp end={1583} duration={2.5} separator="." />}
                  </div>
                  <p className="text-white/80">Infoprodutores ativos</p>
                </div>
                <div>
                  <div className="text-5xl font-bold mb-2">
                    {inView && <CountUp end={98} duration={2.5} />}%
                  </div>
                  <p className="text-white/80">De satisfação</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Casos de Sucesso Reais
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja como outros infoprodutores estão transformando conteúdo em apps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => {
            const Icon = testimonial.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all bg-card/50 backdrop-blur-md border-primary/20">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="mb-4 p-3 bg-primary/10 rounded-lg inline-block">
                      <p className="text-primary font-bold text-sm">{testimonial.result}</p>
                    </div>
                    <p className="text-muted-foreground mb-6 italic">"{testimonial.quote}"</p>
                    <div>
                      <p className="font-bold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
