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

export function OffersList({ offers, actionLabel = "Zobacz" }: { offers: Offer[]; actionLabel?: string }) {
  if (offers.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Brak ofert spełniających kryteria.
      </p>
    );
  }

  return (
    <>
      {/* Desktop: tabela */}
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
            {offers.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.client}</TableCell>
                <TableCell className="text-muted-foreground">{o.service}</TableCell>
                <TableCell className="whitespace-nowrap">{formatPrice(o.price)}</TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(o.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/offers/$id" params={{ id: o.id }}>
                      {actionLabel}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: karty */}
      <ul className="grid gap-3 md:hidden">
        {offers.map((o) => (
          <li key={o.id} className="rounded-xl border border-border bg-card p-4 shadow-soft">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{o.client}</h3>
                <p className="truncate text-sm text-muted-foreground">{o.service}</p>
              </div>
              <StatusBadge status={o.status} />
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <div className="flex gap-1">
                <dt className="text-muted-foreground">Cena:</dt>
                <dd className="font-medium">{formatPrice(o.price)}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="text-muted-foreground">Data:</dt>
                <dd>{formatDate(o.createdAt)}</dd>
              </div>
            </dl>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link to="/offers/$id" params={{ id: o.id }}>
                {actionLabel}
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
