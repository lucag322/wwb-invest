"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DEAL_STATUSES } from "@/lib/constants";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Calculator, Plus } from "lucide-react";

interface DealDetail {
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
  updatedAt: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
}

function buildSimulatorUrl(deal: DealDetail): string {
  const params = new URLSearchParams();
  params.set("price", String(deal.price));
  params.set("rent", String(deal.monthlyRent));
  if (deal.name) params.set("name", deal.name);
  return `/calculator?${params.toString()}`;
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [deal, setDeal] = useState<DealDetail | null>(null);

  useEffect(() => {
    fetch(`/api/deals/${id}`)
      .then((r) => r.json())
      .then(setDeal);
  }, [id]);

  if (!deal) {
    return (
      <PageContainer>
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  const annualRent = deal.monthlyRent * 12;
  const grossYield =
    deal.price > 0 ? ((annualRent / deal.price) * 100).toFixed(1) : "—";

  return (
    <PageContainer>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-2"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour
      </Button>

      <PageHeader
        title={deal.name}
        description={deal.city}
        action={
          <div className="flex gap-2">
            {deal.listingUrl && (
              <a
                href={deal.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" /> Annonce
                </Button>
              </a>
            )}
            <Link href={buildSimulatorUrl(deal)}>
              <Button variant="outline" size="sm">
                <Calculator className="h-4 w-4 mr-1" /> Simuler
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Prix" value={formatCurrency(deal.price)} mono />
            <InfoRow
              label="Loyers mensuels HC"
              value={formatCurrency(deal.monthlyRent)}
              mono
            />
            <InfoRow
              label="Loyer annuel"
              value={formatCurrency(annualRent)}
              mono
            />
            <InfoRow label="Nombre de lots" value={String(deal.lots)} />
            <InfoRow label="DPE" value={deal.dpe || "—"} />
            {deal.address && <InfoRow label="Adresse" value={deal.address} />}
            {deal.listingUrl && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Annonce</span>
                <a
                  href={deal.listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline flex items-center gap-1 max-w-[60%] truncate"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {(() => {
                      try {
                        return new URL(deal.listingUrl).hostname;
                      } catch {
                        return "Voir l'annonce";
                      }
                    })()}
                  </span>
                </a>
              </div>
            )}
            <InfoRow label="Ajouté le" value={formatDate(deal.createdAt)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Analyse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Statut</span>
              <Select
                value={deal.status}
                onValueChange={async (v) => {
                  if (v === null) return;
                  const prev = deal.status;
                  setDeal({ ...deal, status: v });
                  const res = await fetch(`/api/deals/${deal.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: v }),
                  });
                  if (res.ok) {
                    toast.success("Statut mis à jour");
                  } else {
                    setDeal({ ...deal, status: prev });
                    toast.error("Erreur lors de la mise à jour");
                  }
                }}
              >
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rentable</span>
              <Badge
                className={
                  deal.profitable === "oui"
                    ? "bg-green-500/15 text-green-400"
                    : deal.profitable === "moyen"
                      ? "bg-yellow-500/15 text-yellow-400"
                      : "bg-red-500/15 text-red-400"
                }
              >
                {deal.profitable}
              </Badge>
            </div>
            <InfoRow label="Rendement brut" value={`${grossYield}%`} mono />
            {deal.estimatedCashFlow != null && (
              <InfoRow
                label="Cash flow estimé"
                value={formatCurrency(deal.estimatedCashFlow)}
                mono
              />
            )}
          </CardContent>
        </Card>
      </div>

      {deal.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{deal.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Tâches liées</CardTitle>
          <Link href={`/tasks?dealId=${deal.id}`}>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Créer une tâche
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {deal.tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune tâche liée à ce deal
            </p>
          ) : (
            <div className="space-y-2">
              {deal.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded border border-border"
                >
                  <span className="text-sm flex-1">{task.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {task.status === "done"
                      ? "Terminé"
                      : task.status === "in_progress"
                        ? "En cours"
                        : "À faire"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
