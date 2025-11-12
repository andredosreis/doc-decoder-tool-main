import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function StickyCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setIsVisible(scrollPercentage > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-lg transition-transform duration-300">
      <div className="container-app py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm md:text-base font-semibold">
              📱 Doc Decoder Tool
            </span>
            <span className="hidden md:inline text-sm text-muted-foreground">
              PDF → App em segundos
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-primary hidden sm:inline">
              🔥 Primeiros 100 ganham setup grátis
            </span>
            <Button
              size="sm"
              className="btn-glow"
              onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Transformar Agora
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
