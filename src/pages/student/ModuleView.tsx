import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Download, ExternalLink, FileText } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'pdf' | 'text' | 'quiz';
  video_url: string | null;
  pdf_url: string | null;
  content_text: string | null;
  product_id: string;
}

export default function StudentModuleView() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [module, setModule] = useState<Module | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (user && moduleId) {
      fetchModule();
      checkProgress();
    }
  }, [user, moduleId]);

  const fetchModule = async () => {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (error) throw error;

      // Verificar acesso ao produto
      const { data: purchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user?.id)
        .eq('product_id', data.product_id)
        .eq('status', 'approved')
        .maybeSingle();

      if (!purchase && !data.is_preview) {
        toast({
          variant: "destructive",
          title: "Acesso negado",
          description: "Você não tem acesso a este módulo.",
        });
        navigate('/student');
        return;
      }

      setModule(data);
    } catch (error: any) {
      console.error('Erro ao buscar módulo:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar módulo",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkProgress = async () => {
    const { data } = await supabase
      .from('user_progress')
      .select('completed')
      .eq('user_id', user?.id)
      .eq('module_id', moduleId)
      .maybeSingle();

    if (data) {
      setIsCompleted(data.completed);
    }
  };

  const handleDownloadPDF = async () => {
    if (!module?.pdf_url) return;
    
    try {
      const response = await fetch(module.pdf_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${module.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Download iniciado",
        description: "O PDF está sendo baixado.",
      });
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro ao baixar PDF",
        description: "Tente novamente.",
      });
    }
  };

  const markAsComplete = async () => {
    try {
      const { data: existingProgress } = await supabase
        .from('user_progress')
        .select('id')
        .eq('user_id', user?.id)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (existingProgress) {
        await supabase
          .from('user_progress')
          .update({ 
            completed: true, 
            progress_percentage: 100,
            completed_at: new Date().toISOString() 
          })
          .eq('id', existingProgress.id);
      } else {
        await supabase
          .from('user_progress')
          .insert({
            user_id: user?.id,
            module_id: moduleId,
            completed: true,
            progress_percentage: 100,
            completed_at: new Date().toISOString()
          });
      }

      setIsCompleted(true);
      toast({
        title: "Módulo concluído!",
        description: "Seu progresso foi salvo.",
      });
    } catch (error: any) {
      console.error('Erro ao salvar progresso:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar progresso",
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando módulo...</p>
      </div>
    );
  }

  if (!module) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/student/product/${module.product_id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Curso
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{module.title}</h1>
              {module.description && (
                <p className="text-muted-foreground mt-2">{module.description}</p>
              )}
            </div>
            <Button
              onClick={markAsComplete}
              disabled={isCompleted}
              variant={isCompleted ? "outline" : "default"}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isCompleted ? "Concluído" : "Marcar como Concluído"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="p-6">
          {module.type === 'video' && module.video_url && (
            <div className="aspect-video">
              <iframe
                src={module.video_url}
                className="w-full h-full rounded-lg"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          )}

          {module.type === 'pdf' && module.pdf_url && (
            <div className="space-y-6">
              <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
                <FileText className="h-16 w-16 mx-auto text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Material em PDF</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Clique em um dos botões abaixo para visualizar ou baixar o material do curso
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button
                    size="lg"
                    asChild
                  >
                    <a
                      href={module.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-5 w-5 mr-2" />
                      Abrir PDF em Nova Aba
                    </a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleDownloadPDF}
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Baixar PDF
                  </Button>
                </div>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Dica:</strong> Se o PDF não abrir automaticamente, verifique se o seu navegador está bloqueando pop-ups. 
                  Você também pode fazer o download e abrir o arquivo diretamente no seu dispositivo.
                </p>
              </div>
            </div>
          )}

          {module.type === 'text' && module.content_text && (
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <div dangerouslySetInnerHTML={{ __html: module.content_text }} />
            </div>
          )}

          {module.type === 'quiz' && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Funcionalidade de quiz será implementada em breve
              </p>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
