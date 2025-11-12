-- Permitir upload de imagens de produtos para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de imagens"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir visualização pública das imagens
CREATE POLICY "Imagens de produtos são públicas"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Permitir que usuários atualizem suas próprias imagens
CREATE POLICY "Usuários podem atualizar suas imagens"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários deletem suas próprias imagens
CREATE POLICY "Usuários podem deletar suas imagens"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);