-- Criar tabela de certificados
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Habilitar RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios certificados
CREATE POLICY "Users can view own certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins podem ver certificados de seus produtos
CREATE POLICY "Admins can view product certificates"
ON public.certificates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = certificates.product_id
    AND products.admin_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Função para gerar número do certificado
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  new_number TEXT;
BEGIN
  new_number := 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
  RETURN new_number;
END;
$$;