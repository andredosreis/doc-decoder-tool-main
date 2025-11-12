import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export function PDFProblems() {
  const problems = [
    "Lentidão extrema em dispositivos móveis",
    "Interface confusa que diminui o engajamento",
    "Visual ultrapassado e pouco profissional",
    "Incompatibilidade com diversos navegadores",
    "Zero interação: sem notificações ou atualizações",
    "Impossível rastrear consumo e comportamento do usuário",
  ];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-destructive/5 via-destructive/10 to-background -z-10" />
      
      <div className="container-app">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block mb-4"
          >
            <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-destructive">
            Pare de Entregar Conteúdo Estático e Limitado
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            PDFs são antiquados e improdutivos. Seu conteúdo premium merece uma experiência digital de verdade.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-destructive/20 bg-background/80 backdrop-blur-sm hover:shadow-elegant hover:scale-105 hover:border-destructive/40 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-destructive mt-2 flex-shrink-0 animate-pulse" />
                    <p className="text-muted-foreground font-medium leading-relaxed">{problem}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
