import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import { formatDate, formatPrice, type Offer } from "@/data/offers";

export function OffersList({
  offers,
  actionLabel = "Zobacz",
  emptyMessage = "Brak ofert spełniających kryteria.",
}: {
  offers: Offer[];
  actionLabel?: string;
  emptyMessage?: string;
}) {
  if (offers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-soft md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Klient</TableHead>
              <TableHead>Usługa</TableHead>
              <TableHead>Cena</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Akcja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell className="font-medium">{offer.client}</TableCell>
                <TableCell className="text-muted-foreground">{offer.service}</TableCell>
                <TableCell className="whitespace-nowrap">{formatPrice(offer.price)}</TableCell>
                <TableCell>
                  <StatusBadge status={offer.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(offer.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/offers/$id" params={{ id: offer.id }}>
                      {actionLabel}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="grid gap-3 md:hidden">
        {offers.map((offer) => (
          <li key={offer.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{offer.client}</h3>
                <p className="truncate text-sm text-muted-foreground">{offer.service}</p>
              </div>
              <StatusBadge status={offer.status} />
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <div className="flex gap-1">
                <dt className="text-muted-foreground">Cena:</dt>
                <dd className="font-medium">{formatPrice(offer.price)}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-muted-foreground">Data:</dt>
                <dd>{formatDate(offer.createdAt)}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/offers/$id" params={{ id: offer.id }}>
                {actionLabel}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
