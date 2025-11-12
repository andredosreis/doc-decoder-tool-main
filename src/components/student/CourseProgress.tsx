import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, CheckCircle } from "lucide-react";

interface CourseProgressProps {
  courseId: string;
  title: string;
  description: string | null;
  thumbnail: string | null;
  totalModules: number;
  completedModules: number;
  lastAccessed?: string;
}

export function CourseProgress({
  courseId,
  title,
  description,
  thumbnail,
  totalModules,
  completedModules,
  lastAccessed
}: CourseProgressProps) {
  const navigate = useNavigate();
  const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
      {thumbnail && (
        <div className="aspect-video overflow-hidden bg-muted relative">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
          {progress === 100 && (
            <div className="absolute top-2 right-2 bg-green-500 text-white p-2 rounded-full">
              <CheckCircle className="h-5 w-5" />
            </div>
          )}
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="line-clamp-2">{title}</CardTitle>
        {description && (
          <CardDescription className="line-clamp-2">
            {description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{completedModules}/{totalModules} módulos</span>
          </div>
          {lastAccessed && (
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Último acesso</span>
            </div>
          )}
        </div>

        <Button 
          className="w-full"
          onClick={() => navigate(`/student/product/${courseId}`)}
        >
          {progress === 100 ? 'Revisar Curso' : 'Continuar Estudando'}
        </Button>
      </CardContent>
    </Card>
  );
}
