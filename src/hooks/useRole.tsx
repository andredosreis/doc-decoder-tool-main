import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'moderator' | 'user';

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setRole(data?.role || null);
    } catch (error) {
      console.error('Erro ao buscar role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (requiredRole: AppRole) => {
    return role === requiredRole;
  };

  const isAdmin = () => role === 'admin';
  const isUser = () => role === 'user';

  return { role, loading, hasRole, isAdmin, isUser };
};
