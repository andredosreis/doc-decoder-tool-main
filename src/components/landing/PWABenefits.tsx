import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Bell, Wifi, BarChart3, Lock, Rocket } from "lucide-react";
import { motion } from "framer-motion";

export function PWABenefits() {
  const benefits = [
    {
      icon: Rocket,
      benefit: "Abre em 1 segundo",
      how: "Otimizado como PWA com cache inteligente",
    },
    {
      icon: Bell,
      benefit: "Engaja com push",
      how: "Notificações nativas aumentam retenção em 300%",
    },
    {
      icon: Wifi,
      benefit: "Funciona offline",
      how: "Armazenado localmente, acesso sem internet",
    },
    {
      icon: Smartphone,
      benefit: "Instalável na tela",
      how: "Ícone na home como app nativo, sem app store",
    },
    {
      icon: BarChart3,
      benefit: "Analytics em tempo real",
      how: "Saiba exatamente quem leu o quê e quando",
    },
    {
      icon: Lock,
      benefit: "Seguro e protegido",
      how: "Criptografia de ponta a ponta, sem pirataria",
    },
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-subtle -z-10" />
      
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Benefícios Que Fazem Diferença Real
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Cada recurso foi pensado para aumentar o valor percebido do seu conteúdo
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-elegant transition-all duration-300 border-primary/10 hover:border-primary/30 bg-background/80 backdrop-blur-sm group">
                  <CardContent className="p-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                      className="w-12 h-12 mb-4 bg-gradient-primary rounded-xl flex items-center justify-center group-hover:shadow-glow transition-all duration-300"
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-2">{item.benefit}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.how}</p>
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
