-- Bug 5 do TEST-GAP-ANALYSIS.md
--
-- Adiciona WITH CHECK explícito a três policies FOR ALL que dependiam da
-- derivação automática do PostgreSQL (USING usado como WITH CHECK por
-- ausência da clausula explícita).
--
-- Não introduz mudança funcional de segurança imediata (PG já derivava o
-- WITH CHECK do USING), mas remove a dependência implícita e protege
-- contra futuras alterações de comportamento do PG ou migração para outras
-- camadas de RLS.
--
-- Policies afectadas:
--   - public.products / "Admins can manage own products"
--   - public.modules / "Admins can manage product modules"
--   - public.user_progress / "Users can manage own progress"

BEGIN;

-- products
DROP POLICY IF EXISTS "Admins can manage own products" ON public.products;
CREATE POLICY "Admins can manage own products"
  ON public.products FOR ALL
  USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

-- modules
DROP POLICY IF EXISTS "Admins can manage product modules" ON public.modules;
CREATE POLICY "Admins can manage product modules"
  ON public.modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = modules.product_id
        AND products.admin_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = modules.product_id
        AND products.admin_id = auth.uid()
    )
  );

-- user_progress
DROP POLICY IF EXISTS "Users can manage own progress" ON public.user_progress;
CREATE POLICY "Users can manage own progress"
  ON public.user_progress FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMIT;
