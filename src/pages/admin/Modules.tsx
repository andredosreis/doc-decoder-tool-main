import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ModuleCard } from "@/components/admin/ModuleCard";
import { ModuleForm } from "@/components/admin/ModuleForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Plus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

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

interface Product {
  id: string;
  title: string;
}

export default function AdminModules() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | undefined>();
  const [moduleToDelete, setModuleToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (user && productId) {
      fetchProduct();
      fetchModules();
    }
  }, [user, productId]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title')
        .eq('id', productId)
        .single();

      if (error) throw error;
      setProduct(data);
    } catch (error: any) {
      console.error('Erro ao buscar produto:', error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar produto",
        description: error.message,
      });
    }
  };

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('product_id', productId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setModules(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar módulos:', error);
      toast({
        variant: "destructive",
        title: "Erro ao buscar módulos",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedModule(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (module: Module) => {
    setSelectedModule(module);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    setModuleToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!moduleToDelete) return;

    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleToDelete);

      if (error) throw error;

      toast({
        title: "Módulo excluído",
        description: "O módulo foi excluído com sucesso.",
      });

      fetchModules();
    } catch (error: any) {
      console.error('Erro ao excluir módulo:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir módulo",
        description: error.message,
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setModuleToDelete(null);
    }
  };

  const handleSuccess = () => {
    setIsDialogOpen(false);
    setSelectedModule(undefined);
    fetchModules();
  };

  const nextOrderIndex = modules.length > 0 
    ? Math.max(...modules.map(m => m.order_index)) + 1 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando módulos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin/products')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Módulos</h1>
            {product && (
              <p className="text-muted-foreground">Produto: {product.title}</p>
            )}
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Módulo
        </Button>
      </div>

      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">Nenhum módulo encontrado</p>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Módulo
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedModule ? "Editar Módulo" : "Criar Novo Módulo"}
            </DialogTitle>
            <DialogDescription>
              {selectedModule ? "Atualize as informações do módulo" : "Preencha os dados para criar um novo módulo"}
            </DialogDescription>
          </DialogHeader>
          {productId && (
            <ModuleForm
              productId={productId}
              module={selectedModule}
              onSuccess={handleSuccess}
              onCancel={() => setIsDialogOpen(false)}
              nextOrderIndex={nextOrderIndex}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O módulo será excluído permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
