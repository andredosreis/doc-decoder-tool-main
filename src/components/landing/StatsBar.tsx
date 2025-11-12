import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";

export function StatsBar() {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const stats = [
    { value: 2500000, prefix: "R$ ", suffix: "+", label: "Em vendas processadas", decimals: 0 },
    { value: 15000, prefix: "", suffix: "+", label: "Alunos ativos", decimals: 0 },
    { value: 500, prefix: "", suffix: "+", label: "Produtores usando", decimals: 0 },
    { value: 98, prefix: "", suffix: "%", label: "De satisfação", decimals: 0 },
  ];

  return (
    <section className="py-12 px-4 bg-secondary/50" ref={ref}>
      <div className="container-app">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                {inView && (
                  <>
                    {stat.prefix}
                    <CountUp
                      end={stat.value}
                      duration={2.5}
                      separator="."
                      decimals={stat.decimals}
                    />
                    {stat.suffix}
                  </>
                )}
              </div>
              <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
