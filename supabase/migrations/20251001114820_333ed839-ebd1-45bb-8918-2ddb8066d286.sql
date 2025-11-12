-- Permitir upload de vídeos e PDFs para usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de conteúdo de módulos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'module-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários atualizem seus próprios arquivos
CREATE POLICY "Usuários podem atualizar seus arquivos de módulos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'module-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'module-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir que usuários deletem seus próprios arquivos
CREATE POLICY "Usuários podem deletar seus arquivos de módulos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'module-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir visualização apenas para usuários autenticados que compraram o produto
-- (Por enquanto permitindo para todos autenticados, depois será refinado)
CREATE POLICY "Usuários autenticados podem visualizar conteúdo de módulos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'module-content');