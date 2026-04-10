"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DealForm } from "@/features/deals/components/deal-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/lib/utils";
import { DEAL_STATUSES } from "@/lib/constants";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  Plus,
  Building2,
  MoreVertical,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";
import type { DealFormData } from "@/types";

interface Deal {
  id: string;
  name: string;
  city: string;
  address: string | null;
  price: number;
  monthlyRent: number;
  lots: number;
  dpe: string | null;
  listingUrl: string | null;
  status: string;
  profitable: string;
  estimatedCashFlow: number | null;
  grossYield: number | null;
  notes: string | null;
  createdAt: string;
}

function dealToInitialFormData(
  deal: Deal
): Partial<DealFormData> & { id: string } {
  return {
    id: deal.id,
    name: deal.name,
    city: deal.city,
    address: deal.address ?? undefined,
    price: deal.price,
    monthlyRent: deal.monthlyRent,
    lots: deal.lots,
    dpe: deal.dpe ?? undefined,
    listingUrl: deal.listingUrl ?? undefined,
    status: deal.status as DealFormData["status"],
    profitable: deal.profitable as DealFormData["profitable"],
    estimatedCashFlow: deal.estimatedCashFlow ?? undefined,
    grossYield: deal.grossYield ?? undefined,
    notes: deal.notes ?? undefined,
  };
}

const STATUS_LABELS: Record<string, string> = {
  a_analyser: "À analyser",
  interessant: "Intéressant",
  visite_prevue: "Visite prévue",
  visite: "Visité",
  offre_faite: "Offre faite",
  refuse: "Refusé",
  achete: "Acheté",
};

const PROFIT_COLORS: Record<string, string> = {
  oui: "bg-green-500/15 text-green-400",
  moyen: "bg-yellow-500/15 text-yellow-400",
  non: "bg-red-500/15 text-red-400",
};

export default function DealsPage() {
  const { data: deals = [], isLoading: loading, mutate } = useSWR<Deal[]>("/api/deals", fetcher);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const router = useRouter();

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      const matchSearch =
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.city.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || d.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [deals, search, filterStatus]);

  async function handleCreate(data: DealFormData) {
    const res = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Deal créé");
      mutate();
    }
  }

  async function handleUpdate(data: DealFormData) {
    if (!editingDeal) return;
    const res = await fetch(`/api/deals/${editingDeal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Deal modifié");
      setEditingDeal(null);
      mutate();
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/deals/${deleteId}`, { method: "DELETE" });
    toast.success("Deal supprimé");
    setDeleteId(null);
    mutate();
  }

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Deals" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Deals"
        description={`${deals.length} opportunité(s)`}
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau deal
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher par nom ou ville..."
          />
        </div>
        <Select
          value={filterStatus}
          onValueChange={(v) => {
            if (v !== null) setFilterStatus(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {DEAL_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun deal"
          description="Ajoutez votre première opportunité immobilière"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un deal
            </Button>
          }
        />
      ) : isMobile ? (
        <div className="space-y-3">
          {filtered.map((deal) => (
            <Link key={deal.id} href={`/deals/${deal.id}`}>
              <Card className="hover:bg-accent/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{deal.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {deal.city}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-muted transition-colors"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingDeal(deal);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.preventDefault();
                            setDeleteId(deal.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="font-semibold">
                      {formatCurrency(deal.price)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {STATUS_LABELS[deal.status] || deal.status}
                    </Badge>
                    <Badge
                      className={`text-xs ${PROFIT_COLORS[deal.profitable]}`}
                    >
                      {deal.profitable}
                    </Badge>
                    {deal.grossYield && (
                      <span className="text-xs text-muted-foreground">
                        {deal.grossYield.toFixed(1)}% brut
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bien</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead className="text-right">Loyer/mois</TableHead>
                <TableHead>Rdt brut</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Rentable</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((deal) => (
                <TableRow
                  key={deal.id}
                  className="cursor-pointer hover:bg-accent/30"
                  onClick={() => router.push(`/deals/${deal.id}`)}
                >
                  <TableCell className="font-medium">
                    {deal.name}
                  </TableCell>
                  <TableCell>{deal.city}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(deal.price)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(deal.monthlyRent)}
                  </TableCell>
                  <TableCell className="font-mono">
                    {deal.grossYield ? `${deal.grossYield.toFixed(1)}%` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {STATUS_LABELS[deal.status] || deal.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs ${PROFIT_COLORS[deal.profitable]}`}
                    >
                      {deal.profitable}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-muted transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDeal(deal);
                          }}
                        >
                          <Pencil className="h-4 w-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(deal.id);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <DealForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
      />
      {editingDeal && (
        <DealForm
          open={!!editingDeal}
          onOpenChange={(open) => {
            if (!open) setEditingDeal(null);
          }}
          onSubmit={handleUpdate}
          initialData={dealToInitialFormData(editingDeal)}
        />
      )}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Supprimer le deal"
        description="Cette action est irréversible. Toutes les tâches liées seront dissociées."
        onConfirm={handleDelete}
        confirmLabel="Supprimer"
        destructive
      />
    </PageContainer>
  );
}
