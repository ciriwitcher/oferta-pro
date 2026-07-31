import { useQuery } from "@tanstack/react-query";
import { fetchProviderProfile } from "@/data/provider";

export function useProviderProfile(enabled = true) {
  return useQuery({
    queryKey: ["provider-profile"],
    queryFn: fetchProviderProfile,
    staleTime: 60_000,
    enabled,
    retry: false,
  });
}
