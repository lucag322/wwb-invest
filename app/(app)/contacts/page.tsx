"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { formatDate } from "@/lib/utils";
import { CONTACT_TYPES } from "@/lib/constants";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Plus, Users, MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { ContactFormData } from "@/types";

interface Contact {
  id: string;
  name: string;
  type: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  source: string | null;
  notes: string | null;
  lastContactDate: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  agent: "Agent immobilier",
  notaire: "Notaire",
  courtier: "Courtier",
  comptable: "Comptable",
  artisan: "Artisan",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();
  const [form, setForm] = useState<ContactFormData>({
    name: "",
    type: "agent",
    city: "",
    address: "",
    phone: "",
    email: "",
    source: "",
    notes: "",
    lastContactDate: "",
  });

  const fetchContacts = useCallback(async () => {
    const res = await fetch("/api/contacts");
    const data = await res.json();
    setContacts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city?.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || c.type === filterType;
      return matchSearch && matchType;
    });
  }, [contacts, search, filterType]);

  function openNew() {
    setForm({
      name: "",
      type: "agent",
      city: "",
      address: "",
      phone: "",
      email: "",
      source: "",
      notes: "",
      lastContactDate: "",
    });
    setEditingContact(null);
    setFormOpen(true);
  }

  function openEdit(contact: Contact) {
    setForm({
      name: contact.name,
      type: contact.type as ContactFormData["type"],
      city: contact.city || "",
      address: contact.address || "",
      phone: contact.phone || "",
      email: contact.email || "",
      source: contact.source || "",
      notes: contact.notes || "",
      lastContactDate: contact.lastContactDate
        ? new Date(contact.lastContactDate).toISOString().split("T")[0]
        : "",
    });
    setEditingContact(contact);
    setFormOpen(true);
  }

  async function handleSubmit() {
    const payload = {
      ...form,
      lastContactDate: form.lastContactDate || undefined,
    };

    if (editingContact) {
      await fetch(`/api/contacts/${editingContact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Contact modifié");
    } else {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.success("Contact ajouté");
    }
    setFormOpen(false);
    setEditingContact(null);
    fetchContacts();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await fetch(`/api/contacts/${deleteId}`, { method: "DELETE" });
    toast.success("Contact supprimé");
    setDeleteId(null);
    fetchContacts();
  }

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Contacts" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Contacts"
        description={`${contacts.length} contact(s)`}
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" /> Nouveau contact
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
          value={filterType}
          onValueChange={(v) => {
            if (v !== null) setFilterType(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {CONTACT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun contact"
          description="Ajoutez vos contacts professionnels"
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un contact
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden sm:table-cell">Ville</TableHead>
                <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                <TableHead className="hidden md:table-cell">Dernier contact</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer hover:bg-accent/30"
                  onClick={() => router.push(`/contacts/${contact.id}`)}
                >
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {TYPE_LABELS[contact.type] || contact.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {contact.city || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {contact.phone || "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {contact.lastContactDate
                      ? formatDate(contact.lastContactDate)
                      : "—"}
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
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(contact); }}>
                          <Pencil className="h-4 w-4 mr-2" /> Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setDeleteId(contact.id); }}
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

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingContact(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingContact ? "Modifier le contact" : "Nouveau contact"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nom *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => {
                    if (v !== null) {
                      setForm({
                        ...form,
                        type: v as ContactFormData["type"],
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Ville</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Adresse</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Ex: 12 rue de la Paix, 75001 Paris"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Téléphone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Source</Label>
                <Input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="Ex: Recommandation"
                />
              </div>
              <div className="space-y-1">
                <Label>Dernier contact</Label>
                <Input
                  type="date"
                  value={form.lastContactDate}
                  onChange={(e) =>
                    setForm({ ...form, lastContactDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit}>
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
        onConfirm={handleDelete}
        confirmLabel="Supprimer"
        destructive
      />
    </PageContainer>
  );
}
