import { useQuery } from "@tanstack/react-query";
import { fetchOffers } from "@/data/offers";
import { useAuth } from "@/lib/auth-context";

export function useOffers() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["offers", user?.id],
    queryFn: fetchOffers,
    enabled: Boolean(user),
    staleTime: 15_000,
  });
}
