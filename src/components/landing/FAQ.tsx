import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "Preciso saber programar para usar?",
    answer: "Não! O Doc Decoder Tool foi criado para ser simples. Você faz upload do seu PDF e em segundos tem um app PWA pronto. Zero código necessário."
  },
  {
    question: "O que é PWA e por que é melhor que PDF?",
    answer: "PWA (Progressive Web App) é um app que funciona no navegador mas tem experiência de app nativo. Pode ser instalado na tela inicial, funciona offline, envia notificações e carrega instantaneamente. PDFs são arquivos estáticos sem essas vantagens."
  },
  {
    question: "Posso usar meu próprio domínio?",
    answer: "Sim! No plano Pro e Enterprise você pode usar seu próprio domínio personalizado (ex: app.seusite.com) para seus apps PWA."
  },
  {
    question: "Como funciona a conversão do PDF?",
    answer: "Nossa Decoder Engine™ analisa a estrutura do seu PDF (títulos, capítulos, seções) e automaticamente cria uma navegação fluida e organizada no app. Tudo em segundos."
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim, sem burocracia. Você pode cancelar sua assinatura quando quiser. Oferecemos também garantia de 14 dias para você testar sem riscos."
  },
  {
    question: "Meus clientes precisam instalar algo?",
    answer: "Não precisam baixar nada! O app PWA abre direto no navegador. Se quiserem, podem adicionar à tela inicial com 1 clique, mas não é obrigatório."
  },
  {
    question: "Quantos apps posso criar?",
    answer: "Depende do plano: Plano Iniciante permite 1 app, Plano Pro permite 5 apps, e Enterprise tem apps ilimitados."
  },
  {
    question: "O app funciona offline?",
    answer: "Sim! Após a primeira visita, o conteúdo fica armazenado localmente no dispositivo do usuário. Ele pode acessar mesmo sem internet."
  },
  {
    question: "Consigo ver analytics de uso?",
    answer: "Sim! Todos os planos incluem analytics. Você vê quem acessou, quando acessou, tempo de leitura e muito mais. Plano Pro tem analytics avançado."
  },
  {
    question: "E se eu não gostar?",
    answer: "Oferecemos garantia incondicional de 14 dias. Se por qualquer motivo não ficar satisfeito, devolvemos 100% do seu dinheiro, sem perguntas."
  }
];

export function FAQ() {
  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container-app">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tire suas dúvidas antes de começar
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
