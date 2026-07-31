import { useQuery } from "@tanstack/react-query";
import { fetchProviderProfile } from "@/data/provider";

export function useProviderProfile() {
  return useQuery({
    queryKey: ["provider-profile"],
    queryFn: fetchProviderProfile,
    staleTime: 60_000,
  });
}
