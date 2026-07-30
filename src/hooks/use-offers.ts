import { useSyncExternalStore } from "react";
import { offersStore } from "@/data/offers";

export function useOffers() {
  return useSyncExternalStore(
    offersStore.subscribe,
    offersStore.getSnapshot,
    offersStore.getServerSnapshot,
  );
}
