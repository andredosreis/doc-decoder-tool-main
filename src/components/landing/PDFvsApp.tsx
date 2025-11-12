import { Card, CardContent } from "@/components/ui/card";
import { XCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export function PDFvsApp() {
  const comparison = [
    {
      feature: "Velocidade de carregamento",
      pdf: "Lento, trava frequentemente",
      app: "Abre em menos de 1 segundo",
    },
    {
      feature: "Navegação",
      pdf: "Leitura travada e linear",
      app: "Navegação fluida por capítulos",
    },
    {
      feature: "Instalação",
      pdf: "Precisa baixar arquivo",
      app: "Um clique já abre",
    },
    {
      feature: "Acesso offline",
      pdf: "Só se baixar antes",
      app: "Automático após primeira visita",
    },
    {
      feature: "Push notifications",
      pdf: "Impossível",
      app: "Notificações nativas",
    },
    {
      feature: "Analytics",
      pdf: "Sem métricas",
      app: "Métricas em tempo real",
    },
    {
      feature: "Aparência",
      pdf: "Design engessado",
      app: "Visual profissional de app",
    },
    {
      feature: "Proteção",
      pdf: "Fácil de copiar",
      app: "Criptografado e seguro",
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
            PDF Tradicional vs App PWA
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Veja a diferença entre entregar conteúdo do jeito antigo e do jeito profissional
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="max-w-5xl mx-auto shadow-elegant bg-background/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-6 text-left font-bold text-lg">Recurso</th>
                      <th className="p-6 text-center font-bold text-lg bg-destructive/5">
                        <div className="flex items-center justify-center gap-2">
                          <XCircle className="h-5 w-5 text-destructive" />
                          PDF Tradicional
                        </div>
                      </th>
                      <th className="p-6 text-center font-bold text-lg bg-primary/5">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          App PWA
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((item, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="p-6 font-semibold">{item.feature}</td>
                        <td className="p-6 text-center text-muted-foreground bg-destructive/5">
                          {item.pdf}
                        </td>
                        <td className="p-6 text-center font-semibold text-primary bg-primary/5">
                          {item.app}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
