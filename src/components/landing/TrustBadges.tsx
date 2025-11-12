import { Shield, Lock, CheckCircle2, Zap } from "lucide-react";

export function TrustBadges() {
  const badges = [
    { icon: Shield, text: "Pagamento Seguro" },
    { icon: Lock, text: "SSL Certificado" },
    { icon: CheckCircle2, text: "Garantia 7 Dias" },
    { icon: Zap, text: "Suporte Rápido" },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-6 mt-8">
      {badges.map((badge, index) => (
        <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
          <badge.icon className="h-4 w-4" />
          <span>{badge.text}</span>
        </div>
      ))}
    </div>
  );
}
