-- ============================================================
-- 🔧 ATUALIZAR TRIGGER PARA CRIAR ADMIN AUTOMATICAMENTE
-- ============================================================
-- Execute este SQL no Supabase SQL Editor
-- Isso fará com que TODO novo usuário seja criado como ADMIN
-- ============================================================

-- Remover trigger antigo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar função para criar admin automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  
  -- Criar role como ADMIN (não mais como 'user')
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- TAMBÉM: Atualizar o usuário existente para admin
-- ============================================================
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'andredosreis@gmail.com');

-- Verificar
SELECT p.email, ur.role 
FROM public.profiles p
JOIN public.user_roles ur ON p.id = ur.user_id;
