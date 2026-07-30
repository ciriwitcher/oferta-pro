import { Badge } from "@/components/ui/badge";
import { statusLabels, type OfferStatus } from "@/data/offers";
import { cn } from "@/lib/utils";

const styles: Record<OfferStatus, string> = {
  szkic: "border-border bg-secondary text-secondary-foreground",
  gotowa: "border-primary/30 bg-accent text-accent-foreground",
  wyslana: "border-emerald-600/25 bg-emerald-50 text-emerald-800",
};

export function StatusBadge({ status }: { status: OfferStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", styles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}
