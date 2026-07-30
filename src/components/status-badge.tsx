import { Badge } from "@/components/ui/badge";
import { statusLabels, type OfferStatus } from "@/data/offers";
import { cn } from "@/lib/utils";

const styles: Record<OfferStatus, string> = {
  draft: "border-border bg-secondary text-secondary-foreground",
  ready: "border-primary/30 bg-accent text-accent-foreground",
  sent: "border-success-border bg-success text-success-foreground",
  accepted: "border-emerald-300 bg-emerald-50 text-emerald-800",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
  archived: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: OfferStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", styles[status])}>
      {statusLabels[status]}
    </Badge>
  );
}
