import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PDFProblems } from "@/components/landing/PDFProblems";
import { ModernSolution } from "@/components/landing/ModernSolution";
import { PWABenefits } from "@/components/landing/PWABenefits";
import { SocialProofCounter } from "@/components/landing/SocialProofCounter";
import { PDFvsApp } from "@/components/landing/PDFvsApp";
import { PricingPlans } from "@/components/landing/PricingPlans";
import { FAQ } from "@/components/landing/FAQ";
import { FinalConversion } from "@/components/landing/FinalConversion";
import { StickyCTA } from "@/components/landing/StickyCTA";
import { TransformationDemo } from "@/components/landing/TransformationDemo";
import { APP_CONFIG } from "@/config/app.config";
import { ArrowRight, Sparkles, Zap, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState(0);

  const screens = [
    { bg: "bg-gradient-to-br from-purple-500 to-pink-500", title: "Fitness App" },
    { bg: "bg-gradient-to-br from-blue-500 to-cyan-500", title: "E-book App" },
    { bg: "bg-gradient-to-br from-green-500 to-emerald-500", title: "Course App" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreen((prev) => (prev + 1) % screens.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDemo = () => {
    document.getElementById("demo-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <StickyCTA />

      {/* Hero Premium Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient Glow Background */}
        <div className="absolute inset-0 bg-gradient-glow pointer-events-none" />
        
        {/* Animated Orbs */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        {/* Top Bar with Social Proof */}
        <div className="absolute top-0 left-0 right-0 bg-card/50 backdrop-blur-md border-b border-border/50">
          <div className="container-app py-4">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-warning fill-warning" />
                <span className="text-muted-foreground">4.9/5 de 2.847 criadores</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Configuração em 60 segundos</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Garantia de 7 dias</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container-app relative z-10 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-left space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Badge variant="secondary" className="mb-6 bg-primary/10 text-primary-glow border-primary/20 backdrop-blur-sm text-sm px-4 py-2">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Edição Especial Limitada
                </Badge>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-5xl md:text-7xl font-bold leading-tight"
              >
                Pare de Entregar Seu Infoproduto{" "}
                <span className="text-gradient">em PDF</span>
              </motion.h1>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-2xl md:text-3xl font-semibold text-primary-glow"
              >
                Evolua para um App Profissional que Funciona Offline, Instala e Impressiona
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-lg md:text-xl text-muted-foreground leading-relaxed"
              >
                Com apenas 1 clique, seu material vira um aplicativo moderno, instalável, acessível em qualquer dispositivo — sem downloads, sem fricção, sem código.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 pt-4"
              >
                <Button
                  size="lg"
                  onClick={handleDemo}
                  className="bg-gradient-primary text-white text-lg px-8 py-7 btn-glow group border-0"
                >
                  Ver Meu App Ao Vivo
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleGetStarted}
                  className="text-lg px-8 py-7 border-2 border-primary/30 hover:border-primary bg-card/50 backdrop-blur-sm hover:bg-primary/10"
                >
                  Transformar Meu Conteúdo Agora
                </Button>
              </motion.div>

              {/* Mini Social Proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex items-center gap-6 pt-6"
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-primary border-2 border-background flex items-center justify-center text-xs font-bold text-white"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-3 w-3 text-warning fill-warning" />
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">2.174 apps</strong> criados nos últimos 30 dias
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Mockup - Estilo AppSell com troca de telas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex items-center justify-center"
            >
              {/* Phone mockup principal */}
              <div className="relative z-20 w-[280px] h-[570px]">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 rounded-[3rem] shadow-2xl" 
                     style={{ boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)' }}>
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-10" />
                  
                  {/* Screen */}
                  <div className="absolute inset-3 bg-white rounded-[2.5rem] overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentScreen}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                        className={`w-full h-full ${screens[currentScreen].bg} flex flex-col items-center justify-center p-6`}
                      >
                        {/* Status bar */}
                        <div className="absolute top-0 left-0 right-0 pt-8 px-6 flex items-center justify-between text-white text-xs">
                          <span>9:41</span>
                          <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            <span>100%</span>
                          </div>
                        </div>
                        
                        {/* App content */}
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6 mt-12">
                          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <Sparkles className="h-10 w-10 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-white text-center">
                            {screens[currentScreen].title}
                          </h3>
                          <div className="space-y-3 w-full">
                            <div className="h-3 bg-white/30 rounded-full w-full" />
                            <div className="h-3 bg-white/30 rounded-full w-4/5" />
                            <div className="h-3 bg-white/30 rounded-full w-3/5" />
                          </div>
                        </div>
                        
                        {/* Bottom nav */}
                        <div className="absolute bottom-6 left-6 right-6 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-around">
                          <div className="w-8 h-8 bg-white/40 rounded-lg" />
                          <div className="w-8 h-8 bg-white/40 rounded-lg" />
                          <div className="w-8 h-8 bg-white/40 rounded-lg" />
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Phone secundário esquerda */}
              <div className="absolute -left-32 top-20 w-[200px] h-[400px] opacity-60 scale-75 rotate-12 z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 rounded-[2.5rem] shadow-xl">
                  <div className="absolute inset-2 bg-gradient-to-br from-primary to-primary-glow rounded-[2rem] opacity-50" />
                </div>
              </div>

              {/* Phone secundário direita */}
              <div className="absolute -right-32 top-32 w-[200px] h-[400px] opacity-60 scale-75 -rotate-12 z-10">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 rounded-[2.5rem] shadow-xl">
                  <div className="absolute inset-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-[2rem] opacity-50" />
                </div>
              </div>
              
              {/* Floating Elements */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-8 -left-8 w-40 h-40 bg-primary-glow/20 rounded-full blur-3xl"
              />
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex items-start justify-center p-2">
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-primary rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Rest of sections */}
      <PDFProblems />
      <ModernSolution />
      <div id="demo-section">
        <TransformationDemo />
      </div>
      <PWABenefits />
      <SocialProofCounter />
      <PDFvsApp />
      <div id="planos">
        <PricingPlans />
      </div>
      <FAQ />
      <FinalConversion />

      {/* Footer Premium */}
      <footer className="relative border-t border-border/50 bg-card/30 backdrop-blur-md py-12">
        <div className="container-app">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-xl mb-4 text-gradient">{APP_CONFIG.name}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Transforme seu conhecimento em um aplicativo profissional sem código.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Recursos</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Casos de Uso</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© 2025 {APP_CONFIG.name}. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
