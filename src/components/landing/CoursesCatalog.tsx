import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, Users } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  price: number;
}

export function CoursesCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, description, thumbnail_url, price')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Cursos Disponíveis
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore nossos cursos e comece sua jornada de aprendizado hoje mesmo
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              {product.thumbnail_url && (
                <div className="aspect-video overflow-hidden bg-muted">
                  <img
                    src={product.thumbnail_url}
                    alt={product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl line-clamp-2">{product.title}</CardTitle>
                  {product.price && (
                    <Badge variant="secondary" className="shrink-0">
                      R$ {product.price.toFixed(2)}
                    </Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-3">
                  {product.description}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>Módulos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>Acesso Vitalício</span>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => navigate('/auth/signup')}
                >
                  Começar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate('/auth/student-login')}
          >
            Já tem uma conta? Faça login
          </Button>
        </div>
      </div>
    </section>
  );
}
