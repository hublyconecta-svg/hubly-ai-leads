import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIsAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_current_user_admin");
      if (error) throw error;
      return data as boolean;
    },
  });

  return { isAdmin: data === true, loading: isLoading };
}
