import { Package, Edit, Trash2, Eye, EyeOff, BookOpen } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  product: any;
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
}

export function ProductCard({ product, onEdit, onDelete, onToggleActive }: ProductCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        {product.thumbnail_url ? (
          <img 
            src={product.thumbnail_url} 
            alt={product.title}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-muted flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-lg line-clamp-1">{product.title}</h3>
          <Badge variant={product.is_active ? "default" : "secondary"}>
            {product.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
          {product.description}
        </p>
        <p className="text-xl font-bold text-primary">
          R$ {product.price ? parseFloat(product.price).toFixed(2) : "0.00"}
        </p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex flex-wrap gap-2">
        <Button
          variant="default"
          size="sm"
          onClick={() => navigate(`/admin/products/${product.id}/modules`)}
        >
          <BookOpen className="h-4 w-4 mr-1" />
          Módulos
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleActive(product.id, !product.is_active)}
        >
          {product.is_active ? (
            <>
              <EyeOff className="h-4 w-4 mr-1" />
              Desativar
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-1" />
              Ativar
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(product)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
