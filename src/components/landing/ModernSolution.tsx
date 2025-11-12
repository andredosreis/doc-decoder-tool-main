import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";

export function ModernSolution() {
  const features = [
    {
      icon: Sparkles,
      title: "PWA Instalável",
      description: "Visual de app nativo que funciona offline e atualiza automaticamente",
    },
    {
      icon: Zap,
      title: "Carrega em 1 Segundo",
      description: "Otimizado como PWA, sem travamentos ou lentidão",
    },
    {
      icon: Globe,
      title: "Acesso Multiplataforma",
      description: "Funciona perfeitamente em iOS, Android, Desktop - sem app store",
    },
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-4 text-sm backdrop-blur-sm">
              A Nova Era do Conteúdo Digital
            </Badge>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Transforme Seu Conteúdo em Experiência,
            <br />
            <span className="text-gradient">Seus Clientes em Fãs Engajados</span>
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Com apenas 1 clique, transforme seu PDF em um aplicativo moderno e profissional
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-elegant hover:scale-105 transition-all duration-300 bg-background/80 backdrop-blur-sm border-primary/10 hover:border-primary/30">
                  <CardContent className="p-8 text-center">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-elegant"
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </motion.div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Decoder Engine Highlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-primary text-white border-0 shadow-elegant glow-effect overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItMnptLTYgNnYtMiAyem02LTZ2LTIgMnptLTYtNnYyLTJ6bTYtNnYyLTJ6bS02IDZ2LTIgMnptNi02di0yIDJ6bS02LTZ2MiAyem02IDZ2MiAyem0tNi02djIgMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10" />
            <CardContent className="p-12 text-center relative z-10">
              <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                Tecnologia Exclusiva
              </Badge>
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                APP XPRO
              </h3>
              <p className="text-lg opacity-90 max-w-2xl mx-auto leading-relaxed">
                Motor proprietário que transforma estrutura de conteúdo (títulos, capítulos, tópicos) 
                em navegação fluida no app, automaticamente. Sem código, sem complicação.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
