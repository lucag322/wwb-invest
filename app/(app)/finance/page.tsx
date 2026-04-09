"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { KpiCard } from "@/components/shared/kpi-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
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
import {
  FINANCE_CONTACT_TYPES,
  FINANCE_CONTACT_STATUSES,
} from "@/lib/constants";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Landmark,
  Save,
  FileCheck,
} from "lucide-react";

interface FinanceOverview {
  availableDeposit: number;
  borrowingCapacity: number;
  maxMonthlyPayment: number;
}

interface FinanceContact {
  id: string;
  name: string;
  type: string;
  email: string | null;
  phone: string | null;
  status: string;
  notes: string | null;
}

interface FinanceDocument {
  id: string;
  name: string;
  checked: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  relance: "Relancé",
  reponse_recue: "Réponse reçue",
  refus: "Refus",
  accord_principe: "Accord de principe",
};

export default function FinancePage() {
  const [overview, setOverview] = useState<FinanceOverview>({
    availableDeposit: 0,
    borrowingCapacity: 0,
    maxMonthlyPayment: 0,
  });
  const [contacts, setContacts] = useState<FinanceContact[]>([]);
  const [documents, setDocuments] = useState<FinanceDocument[]>([]);
  const [editOverview, setEditOverview] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<FinanceContact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    type: "banque",
    email: "",
    phone: "",
    status: "a_contacter",
    notes: "",
  });

  const fetchAll = useCallback(async () => {
    const [ov, ct, docs] = await Promise.all([
      fetch("/api/finance/overview").then((r) => r.json()),
      fetch("/api/finance/contacts").then((r) => r.json()),
      fetch("/api/finance/documents").then((r) => r.json()),
    ]);
    if (ov) setOverview(ov);
    setContacts(ct);
    setDocuments(docs);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function saveOverview() {
    await fetch("/api/finance/overview", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(overview),
    });
    toast.success("Aperçu financier mis à jour");
    setEditOverview(false);
  }

  async function toggleDocument(doc: FinanceDocument) {
    await fetch("/api/finance/documents", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: doc.id, checked: !doc.checked }),
    });
    setDocuments((prev) =>
      prev.map((d) => (d.id === doc.id ? { ...d, checked: !d.checked } : d))
    );
  }

  async function handleContactSubmit() {
    if (editingContact) {
      await fetch(`/api/finance/contacts/${editingContact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      toast.success("Contact modifié");
    } else {
      await fetch("/api/finance/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      toast.success("Contact ajouté");
    }
    setFormOpen(false);
    setEditingContact(null);
    fetchAll();
  }

  async function handleDeleteContact() {
    if (!deleteId) return;
    await fetch(`/api/finance/contacts/${deleteId}`, { method: "DELETE" });
    toast.success("Contact supprimé");
    setDeleteId(null);
    fetchAll();
  }

  function openEditContact(contact: FinanceContact) {
    setContactForm({
      name: contact.name,
      type: contact.type,
      email: contact.email || "",
      phone: contact.phone || "",
      status: contact.status,
      notes: contact.notes || "",
    });
    setEditingContact(contact);
    setFormOpen(true);
  }

  function openNewContact() {
    setContactForm({
      name: "",
      type: "banque",
      email: "",
      phone: "",
      status: "a_contacter",
      notes: "",
    });
    setEditingContact(null);
    setFormOpen(true);
  }

  const checkedDocs = documents.filter((d) => d.checked).length;

  return (
    <PageContainer>
      <PageHeader
        title="Finance"
        description="Suivi du financement et des dossiers"
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <KpiCard
          title="Apport Disponible"
          value={formatCurrency(overview.availableDeposit)}
          icon={Wallet}
        />
        <KpiCard
          title="Capacité Emprunt"
          value={formatCurrency(overview.borrowingCapacity)}
          icon={TrendingUp}
        />
        <KpiCard
          title="Mensualité Max"
          value={formatCurrency(overview.maxMonthlyPayment)}
          icon={CreditCard}
        />
      </div>

      {editOverview ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Modifier l&apos;aperçu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <CurrencyInput
                label="Apport disponible"
                value={overview.availableDeposit}
                onChange={(v) =>
                  setOverview({ ...overview, availableDeposit: v })
                }
                suffix="€"
                step={1000}
              />
              <CurrencyInput
                label="Capacité d'emprunt"
                value={overview.borrowingCapacity}
                onChange={(v) =>
                  setOverview({ ...overview, borrowingCapacity: v })
                }
                suffix="€"
                step={1000}
              />
              <CurrencyInput
                label="Mensualité max"
                value={overview.maxMonthlyPayment}
                onChange={(v) =>
                  setOverview({ ...overview, maxMonthlyPayment: v })
                }
                suffix="€"
                step={50}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={saveOverview}>
                <Save className="h-4 w-4 mr-1" /> Enregistrer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditOverview(false)}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setEditOverview(true)}>
          <Pencil className="h-4 w-4 mr-1" /> Modifier l&apos;aperçu
        </Button>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Contacts financement</CardTitle>
          <Button size="sm" onClick={openNewContact}>
            <Plus className="h-4 w-4 mr-1" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="Aucun contact"
              description="Ajoutez vos banques et courtiers"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {c.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {STATUS_LABELS[c.status] || c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-muted transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditContact(c)}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteId(c.id)}
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Documents ({checkedDocs}/{documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-accent/30"
              >
                <Checkbox
                  checked={doc.checked}
                  onCheckedChange={() => toggleDocument(doc)}
                />
                <span
                  className={`text-sm ${doc.checked ? "line-through text-muted-foreground" : ""}`}
                >
                  {doc.name}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingContact(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Modifier le contact" : "Nouveau contact"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nom</Label>
              <Input
                value={contactForm.name}
                onChange={(e) =>
                  setContactForm({ ...contactForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={contactForm.type}
                  onValueChange={(v) => {
                    if (v !== null) {
                      setContactForm({ ...contactForm, type: v });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FINANCE_CONTACT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Statut</Label>
                <Select
                  value={contactForm.status}
                  onValueChange={(v) => {
                    if (v !== null) {
                      setContactForm({ ...contactForm, status: v });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FINANCE_CONTACT_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={contactForm.email ?? ""}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Téléphone</Label>
                <Input
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={contactForm.notes}
                onChange={(e) =>
                  setContactForm({ ...contactForm, notes: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleContactSubmit}>
                {editingContact ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Supprimer le contact"
        description="Cette action est irréversible."
        onConfirm={handleDeleteContact}
        confirmLabel="Supprimer"
        destructive
      />
    </PageContainer>
  );
}
