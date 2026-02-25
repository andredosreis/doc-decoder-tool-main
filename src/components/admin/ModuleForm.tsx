import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

const moduleSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  type: z.enum(['video', 'pdf', 'text', 'quiz']),
  video_url: z.string().optional(),
  content_text: z.string().optional(),
  thumbnail_url: z.string().optional(),
  duration_seconds: z.union([z.number(), z.nan()]).optional().transform(val => {
    if (typeof val === 'number' && !isNaN(val)) return val;
    return undefined;
  }),
  order_index: z.number().min(0),
  is_preview: z.boolean(),
}).superRefine((data, ctx) => {
  // Validar video_url apenas para tipo video e quando preenchido
  if (data.type === 'video' && data.video_url && data.video_url.trim().length > 0) {
    try {
      new URL(data.video_url);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "URL do vídeo inválida",
        path: ["video_url"]
      });
    }
  }
});

type ModuleFormData = z.infer<typeof moduleSchema>;

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

interface ModuleFormProps {
  productId: string;
  module?: Module;
  onSuccess: () => void;
  onCancel: () => void;
  nextOrderIndex: number;
}

export function ModuleForm({ productId, module, onSuccess, onCancel, nextOrderIndex }: ModuleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string | null>(module?.pdf_url || null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(module?.thumbnail_url || null);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: module?.title || "",
      description: module?.description || "",
      type: module?.type || 'video',
      video_url: module?.video_url || "",
      content_text: module?.content_text || "",
      thumbnail_url: module?.thumbnail_url || "",
      duration_seconds: module?.duration_seconds || undefined,
      order_index: module?.order_index ?? nextOrderIndex,
      is_preview: module?.is_preview || false,
    },
  });

  const selectedType = watch('type');

  // Limpar video_url quando mudar para tipo diferente de video
  useEffect(() => {
    if (selectedType !== 'video') {
      setValue('video_url', '');
    }
  }, [selectedType, setValue]);

  const uploadFile = async (file: File, folder: 'videos' | 'pdfs'): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('module-content')
      .upload(filePath, file, {
        upsert: true
      });

    if (uploadError) {
      console.error('Erro no upload:', uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('module-content')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const onSubmit = async (data: ModuleFormData) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Erro de autenticação",
          description: "Você precisa estar logado para criar módulos.",
        });
        return;
      }

      let pdfUrl = module?.pdf_url;

      if (pdfFile) {
        pdfUrl = await uploadFile(pdfFile, 'pdfs');
      }

      let thumbnailUrl = module?.thumbnail_url;
      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'videos');
      }

      const moduleData = {
        product_id: productId,
        title: data.title,
        description: data.description || null,
        type: data.type,
        video_url: data.type === 'video' ? (data.video_url || null) : null,
        pdf_url: data.type === 'pdf' ? pdfUrl : null,
        content_text: data.type === 'text' ? data.content_text : null,
        thumbnail_url: thumbnailUrl,
        duration_seconds: data.duration_seconds || null,
        order_index: data.order_index,
        is_preview: data.is_preview,
      };

      if (module) {
        const { error } = await supabase
          .from('modules')
          .update(moduleData)
          .eq('id', module.id);

        if (error) throw error;

        toast({
          title: "Módulo atualizado",
          description: "O módulo foi atualizado com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('modules')
          .insert([moduleData]);

        if (error) throw error;

        toast({
          title: "Módulo criado",
          description: "O módulo foi criado com sucesso.",
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar módulo:', error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar módulo",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setPdfPreview(file.name);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" {...register("description")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="type">Tipo de Conteúdo</Label>
        <Select
          value={selectedType}
          onValueChange={(value) => setValue('type', value as any)}
        >
          <SelectTrigger id="type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="video">Vídeo</SelectItem>
            <SelectItem value="pdf">PDF</SelectItem>
            <SelectItem value="text">Texto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {selectedType === 'video' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="video_url">URL do Vídeo</Label>
            <Input
              id="video_url"
              type="url"
              placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
              {...register("video_url")}
            />
            {errors.video_url && (
              <p className="text-sm text-destructive">{errors.video_url.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Suporta YouTube, Vimeo, Panda Video e outras plataformas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_seconds">Duração (segundos)</Label>
            <Input
              id="duration_seconds"
              type="number"
              {...register("duration_seconds", { valueAsNumber: true })}
            />
          </div>
        </>
      )}

      {selectedType === 'pdf' && (
        <div className="space-y-2">
          <Label htmlFor="pdf">Arquivo PDF</Label>
          <div className="flex items-center gap-2">
            <Input
              id="pdf"
              type="file"
              accept="application/pdf"
              onChange={handlePdfChange}
              className="flex-1"
            />
            {pdfPreview && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPdfFile(null);
                  setPdfPreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {pdfPreview && (
            <p className="text-sm text-muted-foreground">
              Arquivo selecionado: {pdfPreview}
            </p>
          )}
        </div>
      )}

      {selectedType === 'text' && (
        <div className="space-y-2">
          <Label htmlFor="content_text">Conteúdo do Texto</Label>
          <Textarea
            id="content_text"
            {...register("content_text")}
            rows={10}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="thumbnail">Thumbnail (opcional)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="thumbnail"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setThumbnailFile(file);
                const reader = new FileReader();
                reader.onloadend = () => {
                  setThumbnailPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
              }
            }}
            className="flex-1"
          />
          {thumbnailPreview && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                setThumbnailFile(null);
                setThumbnailPreview(null);
                setValue('thumbnail_url', '');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {thumbnailPreview && (
          <div className="relative w-32 h-32 border rounded overflow-hidden">
            <img 
              src={thumbnailPreview} 
              alt="Thumbnail preview" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="order_index">Ordem</Label>
        <Input
          id="order_index"
          type="number"
          {...register("order_index", { valueAsNumber: true })}
        />
        {errors.order_index && (
          <p className="text-sm text-destructive">{errors.order_index.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_preview"
          checked={watch('is_preview')}
          onCheckedChange={(checked) => setValue('is_preview', checked)}
        />
        <Label htmlFor="is_preview">Disponível como Preview</Label>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Salvando..." : module ? "Atualizar Módulo" : "Criar Módulo"}
        </Button>
      </div>
    </form>
  );
}
