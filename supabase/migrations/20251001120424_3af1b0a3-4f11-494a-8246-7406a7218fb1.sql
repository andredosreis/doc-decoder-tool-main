-- Tornar o bucket module-content público para permitir acesso aos arquivos
UPDATE storage.buckets 
SET public = true 
WHERE id = 'module-content';

-- Criar políticas de acesso para o bucket module-content
CREATE POLICY "Usuários autenticados podem fazer upload de conteúdo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'module-content');

CREATE POLICY "Admins podem visualizar todo o conteúdo do módulo"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'module-content' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Usuários podem visualizar conteúdo de módulos que compraram"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'module-content' AND (
    -- Se for um módulo preview, todos podem ver
    EXISTS (
      SELECT 1 FROM modules
      WHERE modules.pdf_url LIKE '%' || storage.objects.name || '%'
      AND modules.is_preview = true
    )
    OR
    -- Se o usuário comprou o produto, pode ver
    EXISTS (
      SELECT 1 FROM modules
      INNER JOIN purchases ON purchases.product_id = modules.product_id
      WHERE modules.pdf_url LIKE '%' || storage.objects.name || '%'
      AND purchases.user_id = auth.uid()
      AND purchases.status = 'approved'
    )
  )
);

CREATE POLICY "Admins podem deletar conteúdo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'module-content' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = 'admin'
  )
);