import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ReportWithDetails {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
  listings: { title: string; status: string } | null;
  reporter: { full_name: string } | null;
}

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-admin", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.role === "admin";
    },
  });
};

export const useReports = (enabled: boolean) => {
  return useQuery({
    queryKey: ["reports"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, listings(title, status), reporter:profiles!reports_reporter_id_fkey(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ReportWithDetails[];
    },
  });
};

export const useSubmitReport = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ listingId, reason }: { listingId: string; reason: string }) => {
      if (!user) throw new Error("Must be logged in");
      const { error } = await supabase.from("reports").insert({
        listing_id: listingId,
        reporter_id: user.id,
        reason,
      });
      if (error) throw error;
    },
  });
};

export const useDismissReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase.from("reports").delete().eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};
