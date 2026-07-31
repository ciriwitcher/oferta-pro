import { useQuery } from "@tanstack/react-query";
import { fetchOffers } from "@/data/offers";
import { useAuth } from "@/lib/auth-context";
import { useProviderProfile } from "@/hooks/use-provider";

export function useOffers() {
  const { user } = useAuth();
  useProviderProfile(Boolean(user));

  return useQuery({
    queryKey: ["offers", user?.id],
    queryFn: fetchOffers,
    enabled: Boolean(user),
    staleTime: 15_000,
  });
}
