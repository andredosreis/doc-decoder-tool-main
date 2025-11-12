import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Award, Download, Loader2 } from "lucide-react";

interface Certificate {
  id: string;
  certificate_number: string;
  issued_at: string;
  completed_at: string;
}

interface Product {
  title: string;
  description: string;
}

export default function Certificate() {
  const { productId } = useParams();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (productId) {
      fetchData();
    }
  }, [productId]);

  const fetchData = async () => {
    try {
      // Buscar produto
      const { data: productData } = await supabase
        .from("products")
        .select("title, description")
        .eq("id", productId)
        .single();

      setProduct(productData);

      // Buscar certificado existente
      const { data: certData } = await supabase
        .from("certificates")
        .select("*")
        .eq("product_id", productId)
        .maybeSingle();

      setCertificate(certData);

      // Calcular progresso
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("product_id", productId);

      if (modules && modules.length > 0) {
        const { data: userProgress } = await supabase
          .from("user_progress")
          .select("completed")
          .in("module_id", modules.map(m => m.id));

        const completed = userProgress?.filter(p => p.completed).length || 0;
        setProgress((completed / modules.length) * 100);
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-certificate", {
        body: { productId },
      });

      if (error) throw error;

      toast({
        title: "Certificado gerado!",
        description: "Seu certificado foi criado com sucesso.",
      });

      setCertificate(data.certificate);
    } catch (error: any) {
      console.error("Error generating certificate:", error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar certificado",
        description: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const userName = certificate ? "Aluno" : "";
  const completionDate = certificate 
    ? new Date(certificate.completed_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : "";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Certificado</h2>
        <p className="text-muted-foreground">
          {product?.title}
        </p>
      </div>

      {certificate ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Certificado de Conclusão
            </CardTitle>
            <CardDescription>
              Certificado Nº {certificate.certificate_number}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preview do Certificado */}
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-8 rounded-lg border-2 border-primary/20">
              <div className="text-center space-y-4">
                <Award className="h-16 w-16 mx-auto text-primary" />
                <h3 className="text-2xl font-bold">Certificado de Conclusão</h3>
                <p className="text-lg">Certificamos que</p>
                <p className="text-2xl font-bold text-primary">{userName}</p>
                <p className="text-lg">concluiu com sucesso o curso</p>
                <p className="text-xl font-semibold">{product?.title}</p>
                <div className="pt-6 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Emitido em {completionDate}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    Certificado: {certificate.certificate_number}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button className="flex-1" variant="default">
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                Imprimir
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gerar Certificado</CardTitle>
            <CardDescription>
              Complete o curso para gerar seu certificado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso do curso</span>
                <span className="font-medium">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {progress === 100 ? (
              <Button 
                onClick={generateCertificate} 
                disabled={generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 mr-2" />
                    Gerar Certificado
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center text-muted-foreground p-4 bg-secondary/50 rounded-lg">
                <p>Complete todas as aulas para gerar seu certificado</p>
                <p className="text-sm mt-1">Faltam {(100 - progress).toFixed(0)}% para concluir</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
