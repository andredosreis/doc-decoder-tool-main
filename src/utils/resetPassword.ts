import { supabase } from "@/integrations/supabase/client";

export async function adminResetPassword(email: string, newPassword: string) {
  const { data, error } = await supabase.functions.invoke('reset-user-password', {
    body: { email, newPassword }
  });

  if (error) throw error;
  return data;
}
