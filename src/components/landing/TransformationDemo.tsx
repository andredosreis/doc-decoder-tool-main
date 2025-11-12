import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, ArrowRight, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function TransformationDemo() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-subtle pointer-events-none" />
      
      <div className="container-app relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Veja a Transformação Ao Vivo
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Veja como seu conteúdo pode ficar em formato de app profissional
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-8 md:p-12 bg-card/50 backdrop-blur-md border-primary/20 hover:shadow-glow transition-all duration-300">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">1. Upload seu PDF</h3>
                  <p className="text-muted-foreground text-sm">
                    Arraste ou clique
                  </p>
                </div>
              </motion.div>

              {/* Arrow */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-center"
              >
                <ArrowRight className="h-12 w-12 text-primary" />
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-elegant animate-pulse-glow">
                  <Smartphone className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">2. App Pronto!</h3>
                  <p className="text-muted-foreground text-sm">
                    Em segundos
                  </p>
                </div>
              </motion.div>
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="text-center mt-12"
            >
              <Button
                size="lg"
                onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-gradient-primary text-white text-lg px-8 py-6 btn-glow border-0"
              >
                Quero Meu App Assim Também
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </Card>
        </div>
      </div>
    </section>
  );
}
