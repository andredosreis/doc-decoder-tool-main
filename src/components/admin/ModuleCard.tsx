import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Video, FileText, FileType } from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string | null;
  type: 'video' | 'pdf' | 'text' | 'quiz';
  video_url: string | null;
  pdf_url: string | null;
  content_text: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  order_index: number;
  is_preview: boolean;
}

interface ModuleCardProps {
  module: Module;
  onEdit: (module: Module) => void;
  onDelete: (id: string) => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />;
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

export function ModuleCard({ module, onEdit, onDelete }: ModuleCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {module.thumbnail_url && (
            <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border">
              <img 
                src={module.thumbnail_url} 
                alt={module.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 space-y-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-muted-foreground">#{module.order_index}</span>
              <span className="truncate">{module.title}</span>
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getTypeIcon(module.type)}
                {getTypeLabel(module.type)}
              </Badge>
              {module.is_preview && (
                <Badge variant="outline">Preview</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(module)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(module.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {module.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {module.description}
          </p>
        )}
        {module.duration_seconds && (
          <p className="text-xs text-muted-foreground mt-2">
            Duração: {Math.floor(module.duration_seconds / 60)}min {module.duration_seconds % 60}s
          </p>
        )}
      </CardContent>
    </Card>
  );
}
