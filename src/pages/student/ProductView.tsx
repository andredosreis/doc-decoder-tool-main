import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Play, FileText, FileType, CheckCircle, Clock, Award } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'pdf' | 'text' | 'quiz';
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  is_preview: boolean;
  progress?: {
    completed: boolean;
    progress_percentage: number;
  };
}

interface Product {
  id: string;
  title: string;
  description: string | null;
}

export default function StudentProductView() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const overallProgress = useMemo(() => {
    if (modules.length === 0) return 0;
    const completedCount = modules.filter(m => m.progress?.completed).length;
    return Math.round((completedCount / modules.length) * 100);
  }, [modules]);

  useEffect(() => {
    if (user && productId) {
      checkAccessAndFetch();
    }
  }, [user, productId]);

  const checkAccessAndFetch = async () => {
    try {
      // Verificar se usuário tem acesso
      const { data: purchase, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user?.id)
        .eq('product_id', productId)
        .eq('status', 'approved')
        .maybeSingle();

      if (purchaseError) throw purchaseError;
      
      if (!purchase) {
        toast({
          variant: "destructive",
          title: "Acesso negado",
          description: "Você não tem acesso a este curso.",
        });
        navigate('/student');
        return;
      }

      await Promise.all([fetchProduct(), fetchModules()]);
    } catch (error: any) {
      console.error('Erro:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar curso",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProduct = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, title, description')
      .eq('id', productId)
      .single();

    if (error) throw error;
    setProduct(data);
  };

  const fetchModules = async () => {
    const { data: modulesData, error } = await supabase
      .from('modules')
      .select('*')
      .eq('product_id', productId)
      .order('order_index', { ascending: true });

    if (error) throw error;

    // Buscar progresso do usuário
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('module_id, completed, progress_percentage')
      .eq('user_id', user?.id)
      .in('module_id', modulesData.map(m => m.id));

    const modulesWithProgress = modulesData.map(module => ({
      ...module,
      progress: progressData?.find(p => p.module_id === module.id),
    }));

    setModules(modulesWithProgress);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="h-4 w-4" />;
      case 'pdf':
        return <FileType className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Vídeo';
      case 'pdf':
        return 'PDF';
      case 'text':
        return 'Texto';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Carregando curso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/student')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Meus Cursos
          </Button>
          {product && (
            <>
              <h1 className="text-3xl font-bold">{product.title}</h1>
              {product.description && (
                <p className="text-muted-foreground mt-2">{product.description}</p>
              )}
            </>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Card de Progresso e Certificado */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Progresso do Curso</CardTitle>
            <CardDescription>
              Complete todas as aulas para gerar seu certificado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Conclusão geral</span>
                <span className="font-medium">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} />
            </div>
            {overallProgress === 100 && (
              <Button 
                onClick={() => navigate(`/student/certificate/${productId}`)}
                className="w-full"
              >
                <Award className="h-4 w-4 mr-2" />
                Ver Certificado
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Conteúdo do Curso</h2>
        </div>

        <div className="space-y-4">
          {modules.map((module) => (
            <Card
              key={module.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/student/module/${module.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-muted-foreground">#{module.order_index}</span>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      {module.progress?.completed && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    {module.description && (
                      <CardDescription>{module.description}</CardDescription>
                    )}
                  </div>
                  {module.thumbnail_url && (
                    <div className="w-32 h-20 flex-shrink-0 rounded-md overflow-hidden border">
                      <img
                        src={module.thumbnail_url}
                        alt={module.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {getTypeIcon(module.type)}
                      {getTypeLabel(module.type)}
                    </Badge>
                    {module.duration_seconds && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.floor(module.duration_seconds / 60)}min
                      </Badge>
                    )}
                  </div>
                  {module.progress && (
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <Progress value={module.progress.progress_percentage} className="flex-1" />
                      <span className="text-sm text-muted-foreground">
                        {module.progress.progress_percentage}%
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
