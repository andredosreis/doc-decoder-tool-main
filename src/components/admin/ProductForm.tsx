import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Upload, X } from "lucide-react";

const productSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres").max(100),
  description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres").max(500),
  price: z.string().min(1, "Preço é obrigatório"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(product?.thumbnail_url || null);
  const [logoPreview, setLogoPreview] = useState<string | null>(product?.logo_url || null);

  const { register, handleSubmit, formState: { errors } } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title || "",
      description: product?.description || "",
      price: product?.price?.toString() || "",
    },
  });

  const uploadImage = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let thumbnailUrl = product?.thumbnail_url;
      let logoUrl = product?.logo_url;

      if (thumbnail) {
        const fileName = `${user.id}/${Date.now()}_thumbnail.${thumbnail.name.split('.').pop()}`;
        thumbnailUrl = await uploadImage(thumbnail, 'product-images', fileName);
      }

      if (logo) {
        const fileName = `${user.id}/${Date.now()}_logo.${logo.name.split('.').pop()}`;
        logoUrl = await uploadImage(logo, 'product-images', fileName);
      }

      const productData = {
        title: data.title,
        description: data.description,
        price: parseFloat(data.price),
        thumbnail_url: thumbnailUrl,
        logo_url: logoUrl,
        admin_id: user.id,
      };

      if (product) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id);
        
        if (error) throw error;
        
        toast({
          title: "Produto atualizado",
          description: "As alterações foram salvas com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) throw error;
        
        toast({
          title: "Produto criado",
          description: "Novo produto adicionado com sucesso.",
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Título do Produto</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Ex: Curso de Marketing Digital"
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Descreva seu produto..."
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Preço (R$)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          {...register("price")}
          placeholder="0.00"
        />
        {errors.price && (
          <p className="text-sm text-destructive">{errors.price.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Imagem de Capa</Label>
          {thumbnailPreview ? (
            <div className="relative border-2 rounded-lg overflow-hidden">
              <img 
                src={thumbnailPreview} 
                alt="Preview" 
                className="w-full h-48 object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 shadow-lg"
                onClick={() => {
                  setThumbnail(null);
                  setThumbnailPreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setThumbnail(file);
                  if (file) {
                    setThumbnailPreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
                id="thumbnail"
              />
              <label htmlFor="thumbnail" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para fazer upload
                </p>
              </label>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WEBP • Máx 5MB • Recomendado: 1200x630px
          </p>
        </div>

        <div className="space-y-2">
          <Label>Logo do Produto</Label>
          {logoPreview ? (
            <div className="relative border-2 rounded-lg overflow-hidden">
              <img 
                src={logoPreview} 
                alt="Preview" 
                className="w-full h-48 object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 shadow-lg"
                onClick={() => {
                  setLogo(null);
                  setLogoPreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setLogo(file);
                  if (file) {
                    setLogoPreview(URL.createObjectURL(file));
                  }
                }}
                className="hidden"
                id="logo"
              />
              <label htmlFor="logo" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para fazer upload
                </p>
              </label>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WEBP • Máx 5MB • Recomendado: 400x400px
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {product ? "Atualizar" : "Criar"} Produto
        </Button>
      </div>
    </form>
  );
}
