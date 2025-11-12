import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { BookOpen, LogOut, GraduationCap, TrendingUp, Award } from "lucide-react";
import { StatsCard } from "@/components/student/StatsCard";
import { CourseProgress } from "@/components/student/CourseProgress";
import { NotificationDropdown } from "@/components/NotificationDropdown";

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  totalModules: number;
  completedModules: number;
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalModules: 0,
    completedModules: 0,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  useEffect(() => {
    if (user) {
      fetchCourseData();
    }
  }, [user]);

  const fetchCourseData = async () => {
    try {
      // Buscar produtos comprados
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          product:products (
            id,
            title,
            description,
            thumbnail_url
          )
        `)
        .eq('user_id', user?.id)
        .eq('status', 'approved');

      if (purchasesError) throw purchasesError;

      const coursesData: CourseData[] = [];
      let totalModulesCount = 0;
      let completedModulesCount = 0;

      // Para cada produto, buscar módulos e progresso
      for (const purchase of purchases || []) {
        const productId = purchase.product.id;

        // Buscar total de módulos
        const { data: modules, error: modulesError } = await supabase
          .from('modules')
          .select('id')
          .eq('product_id', productId);

        if (modulesError) throw modulesError;

        const totalModules = modules?.length || 0;
        totalModulesCount += totalModules;

        // Buscar módulos concluídos
        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select('module_id')
          .eq('user_id', user?.id)
          .eq('completed', true)
          .in('module_id', modules?.map(m => m.id) || []);

        if (progressError) throw progressError;

        const completedModules = progress?.length || 0;
        completedModulesCount += completedModules;

        coursesData.push({
          id: productId,
          title: purchase.product.title,
          description: purchase.product.description,
          thumbnail_url: purchase.product.thumbnail_url,
          totalModules,
          completedModules,
        });
      }

      setCourses(coursesData);
      setStats({
        totalCourses: coursesData.length,
        totalModules: totalModulesCount,
        completedModules: completedModulesCount,
      });
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar dados",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando seus cursos...</p>
        </div>
      </div>
    );
  }

  const overallProgress = stats.totalModules > 0 
    ? Math.round((stats.completedModules / stats.totalModules) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-primary" />
                Meus Cursos
              </h1>
              <p className="text-muted-foreground mt-2">
                Bem-vindo de volta! Continue sua jornada de aprendizado
              </p>
            </div>
            <div className="flex gap-2">
              <NotificationDropdown />
              <Button variant="outline" onClick={() => navigate('/')}>
                Página Inicial
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-2">
                Você ainda não possui cursos
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Explore nosso catálogo e comece sua jornada de aprendizado
              </p>
              <Button onClick={() => navigate('/')}>
                Ver Cursos Disponíveis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Estatísticas */}
            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard
                title="Total de Cursos"
                value={stats.totalCourses}
                icon={BookOpen}
                description="Cursos ativos"
              />
              <StatsCard
                title="Progresso Geral"
                value={`${overallProgress}%`}
                icon={TrendingUp}
                description={`${stats.completedModules}/${stats.totalModules} módulos`}
              />
              <StatsCard
                title="Módulos Concluídos"
                value={stats.completedModules}
                icon={Award}
                description="Continue assim!"
              />
            </div>

            {/* Lista de Cursos */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Seus Cursos</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseProgress
                    key={course.id}
                    courseId={course.id}
                    title={course.title}
                    description={course.description}
                    thumbnail={course.thumbnail_url}
                    totalModules={course.totalModules}
                    completedModules={course.completedModules}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
