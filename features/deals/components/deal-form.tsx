"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/shared/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEAL_STATUSES, DEAL_PROFITABLE, DPE_VALUES } from "@/lib/constants";
import { MapPin, Euro, BarChart3, Link2, StickyNote } from "lucide-react";
import type { DealFormData } from "@/types";

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DealFormData) => void;
  initialData?: Partial<DealFormData> & { id?: string };
}

const DPE_COLORS: Record<string, string> = {
  A: "text-green-400",
  B: "text-lime-400",
  C: "text-yellow-400",
  D: "text-orange-400",
  E: "text-orange-500",
  F: "text-red-400",
  G: "text-red-500",
};

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pt-2 pb-1">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

export function DealForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: DealFormProps) {
  const [form, setForm] = useState<DealFormData>({
    name: "",
    city: "",
    address: "",
    price: 0,
    monthlyRent: 0,
    lots: 1,
    dpe: "",
    listingUrl: "",
    status: "a_analyser",
    profitable: "non",
    notes: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name || "",
        city: initialData.city || "",
        address: initialData.address || "",
        price: initialData.price || 0,
        monthlyRent: initialData.monthlyRent || 0,
        lots: initialData.lots || 1,
        dpe: initialData.dpe || "",
        listingUrl: initialData.listingUrl || "",
        status: initialData.status || "a_analyser",
        profitable: initialData.profitable || "non",
        notes: initialData.notes || "",
      });
    } else {
      setForm({
        name: "",
        city: "",
        address: "",
        price: 0,
        monthlyRent: 0,
        lots: 1,
        dpe: "",
        listingUrl: "",
        status: "a_analyser",
        profitable: "non",
        notes: "",
      });
    }
  }, [initialData, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {initialData?.id ? "Modifier le deal" : "Nouveau deal"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label>
              Nom du bien <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Immeuble 3 lots Montreuil"
              required
            />
          </div>

          {/* Location */}
          <div>
            <SectionTitle icon={MapPin}>Localisation</SectionTitle>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Ville <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Ex: Montreuil"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Adresse</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Ex: 12 rue de la Paix"
                />
              </div>
            </div>
          </div>

          {/* Financials */}
          <div>
            <SectionTitle icon={Euro}>Financier</SectionTitle>
            <div className="grid grid-cols-3 gap-3 mt-1">
              <CurrencyInput
                label="Prix *"
                value={form.price}
                onChange={(v) => setForm({ ...form, price: v })}
                suffix="€"
                step={1000}
              />
              <CurrencyInput
                label="Loyers HC"
                value={form.monthlyRent}
                onChange={(v) => setForm({ ...form, monthlyRent: v })}
                suffix="€/mois"
                step={50}
              />
              <CurrencyInput
                label="Lots"
                value={form.lots}
                onChange={(v) =>
                  setForm({ ...form, lots: Math.max(1, Math.round(v)) })
                }
                min={1}
              />
            </div>
          </div>

          {/* Classification */}
          <div>
            <SectionTitle icon={BarChart3}>Classification</SectionTitle>
            <div className="grid grid-cols-3 gap-3 mt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => {
                    if (v !== null)
                      setForm({
                        ...form,
                        status: v as DealFormData["status"],
                      });
                  }}
                >
                  <SelectTrigger className="text-xs">
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
              <div className="space-y-1.5">
                <Label className="text-xs">Rentable ?</Label>
                <Select
                  value={form.profitable}
                  onValueChange={(v) => {
                    if (v !== null)
                      setForm({
                        ...form,
                        profitable: v as DealFormData["profitable"],
                      });
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_PROFITABLE.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">DPE</Label>
                <Select
                  value={form.dpe || "none"}
                  onValueChange={(v) => {
                    if (v !== null)
                      setForm({ ...form, dpe: v === "none" ? "" : v });
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {DPE_VALUES.map((d) => (
                      <SelectItem key={d} value={d}>
                        <span className={DPE_COLORS[d]}>{d}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Link */}
          <div>
            <SectionTitle icon={Link2}>Lien annonce</SectionTitle>
            <Input
              type="url"
              value={form.listingUrl}
              onChange={(e) =>
                setForm({ ...form, listingUrl: e.target.value })
              }
              placeholder="https://www.leboncoin.fr/..."
              className="mt-1"
            />
          </div>

          {/* Notes */}
          <div>
            <SectionTitle icon={StickyNote}>Notes</SectionTitle>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Observations, points d'attention..."
              className="mt-1 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit">
              {initialData?.id ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
