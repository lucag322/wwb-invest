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
import type { DealFormData } from "@/types";

interface DealFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DealFormData) => void;
  initialData?: Partial<DealFormData> & { id?: string };
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
          <DialogTitle>
            {initialData?.id ? "Modifier le deal" : "Nouveau deal"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2">
              <Label>Nom du bien *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ville *</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <CurrencyInput
              label="Prix *"
              value={form.price}
              onChange={(v) => setForm({ ...form, price: v })}
              suffix="€"
              step={1000}
            />
            <CurrencyInput
              label="Loyers mensuels HC"
              value={form.monthlyRent}
              onChange={(v) => setForm({ ...form, monthlyRent: v })}
              suffix="€/mois"
              step={50}
            />
            <CurrencyInput
              label="Nombre de lots"
              value={form.lots}
              onChange={(v) => setForm({ ...form, lots: Math.max(1, Math.round(v)) })}
              min={1}
            />
            <div className="space-y-2">
              <Label>DPE</Label>
              <Select
                value={form.dpe || "none"}
                onValueChange={(v) => {
                  if (v !== null) setForm({ ...form, dpe: v === "none" ? "" : v });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {DPE_VALUES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={form.status}
                onValueChange={(v) => {
                  if (v !== null) setForm({ ...form, status: v as DealFormData["status"] });
                }}
              >
                <SelectTrigger>
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
            <div className="space-y-2">
              <Label>Rentable ?</Label>
              <Select
                value={form.profitable}
                onValueChange={(v) => {
                  if (v !== null) setForm({ ...form, profitable: v as DealFormData["profitable"] });
                }}
              >
                <SelectTrigger>
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
          </div>
          <div className="space-y-2">
            <Label>Lien annonce</Label>
            <Input
              type="url"
              value={form.listingUrl}
              onChange={(e) =>
                setForm({ ...form, listingUrl: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
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
