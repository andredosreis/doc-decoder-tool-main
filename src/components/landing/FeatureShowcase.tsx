import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import { useInView } from "react-intersection-observer";

interface FeatureShowcaseProps {
  title: string;
  description: string;
  benefits: string[];
  imageSide: "left" | "right";
  imageEmoji: string;
  gradient?: boolean;
}

export function FeatureShowcase({
  title,
  description,
  benefits,
  imageSide,
  imageEmoji,
  gradient = false,
}: FeatureShowcaseProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const imageContent = (
    <div className={`flex items-center justify-center ${gradient ? 'bg-gradient-primary' : 'bg-secondary'} rounded-2xl p-12 h-full min-h-[300px]`}>
      <div className="text-9xl">{imageEmoji}</div>
    </div>
  );

  const textContent = (
    <div className="flex flex-col justify-center space-y-6">
      <h3 className="text-3xl md:text-4xl font-bold">{title}</h3>
      <p className="text-lg text-muted-foreground">{description}</p>
      <div className="space-y-3">
        {benefits.map((benefit, index) => (
          <div key={index} className="flex gap-3 items-start">
            <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <p className="text-muted-foreground">{benefit}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <section className="py-12 px-4" ref={ref}>
      <div className="container-app">
        <div
          className={`grid md:grid-cols-2 gap-12 items-center transition-all duration-700 ${
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {imageSide === "left" ? (
            <>
              {imageContent}
              {textContent}
            </>
          ) : (
            <>
              {textContent}
              {imageContent}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
