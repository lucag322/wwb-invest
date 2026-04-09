"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { CONTACT_TYPES } from "@/lib/constants";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Save,
  Trash2,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Info,
} from "lucide-react";
import type { ContactFormData } from "@/types";

interface ContactDetail {
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

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
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

  const fetchContact = useCallback(async () => {
    const res = await fetch(`/api/contacts/${id}`);
    if (res.ok) {
      const data = await res.json();
      setContact(data);
    }
  }, [id]);

  useEffect(() => {
    fetchContact();
  }, [fetchContact]);

  function startEdit() {
    if (!contact) return;
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
    setEditing(true);
  }

  async function handleSave() {
    const res = await fetch(`/api/contacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lastContactDate: form.lastContactDate || undefined,
      }),
    });
    if (res.ok) {
      toast.success("Contact mis à jour");
      setEditing(false);
      fetchContact();
    } else {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function handleDelete() {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    toast.success("Contact supprimé");
    router.push("/contacts");
  }

  if (!contact) {
    return (
      <PageContainer>
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

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
        title={contact.name}
        description={TYPE_LABELS[contact.type] || contact.type}
        action={
          !editing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={startEdit}>
                <Pencil className="h-4 w-4 mr-1" /> Modifier
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Supprimer
              </Button>
            </div>
          ) : undefined
        }
      />

      {editing ? (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Modifier le contact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nom *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => {
                      if (v !== null)
                        setForm({ ...form, type: v as ContactFormData["type"] });
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
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Ville</Label>
                  <Input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Source</Label>
                  <Input
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="Ex: Recommandation"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Adresse</Label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Ex: 12 rue de la Paix, 75001 Paris"
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Téléphone
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Dernier contact
                </Label>
                <Input
                  type="date"
                  value={form.lastContactDate}
                  onChange={(e) =>
                    setForm({ ...form, lastContactDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" /> Enregistrer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.phone && (
                <InfoRow icon={Phone} label="Téléphone">
                  <a
                    href={`tel:${contact.phone}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {contact.phone}
                  </a>
                </InfoRow>
              )}
              {contact.email && (
                <InfoRow icon={Mail} label="Email">
                  <a
                    href={`mailto:${contact.email}`}
                    className="text-sm font-medium text-primary hover:underline truncate"
                  >
                    {contact.email}
                  </a>
                </InfoRow>
              )}
              {contact.address && (
                <InfoRow icon={MapPin} label="Adresse">
                  <span className="text-sm font-medium">{contact.address}</span>
                </InfoRow>
              )}
              {contact.city && (
                <InfoRow icon={MapPin} label="Ville">
                  <span className="text-sm font-medium">{contact.city}</span>
                </InfoRow>
              )}
              {!contact.phone &&
                !contact.email &&
                !contact.address &&
                !contact.city && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucune coordonnée renseignée
                  </p>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow icon={User} label="Type">
                <Badge variant="secondary" className="text-xs">
                  {TYPE_LABELS[contact.type] || contact.type}
                </Badge>
              </InfoRow>
              {contact.source && (
                <InfoRow icon={Info} label="Source">
                  <span className="text-sm font-medium">{contact.source}</span>
                </InfoRow>
              )}
              {contact.lastContactDate && (
                <InfoRow icon={Calendar} label="Dernier contact">
                  <span className="text-sm font-medium">
                    {formatDate(contact.lastContactDate)}
                  </span>
                </InfoRow>
              )}
              <InfoRow icon={Calendar} label="Ajouté le">
                <span className="text-sm font-medium">
                  {formatDate(contact.createdAt)}
                </span>
              </InfoRow>
            </CardContent>
          </Card>

          {contact.notes && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {contact.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer le contact"
        description="Cette action est irréversible."
        onConfirm={handleDelete}
        confirmLabel="Supprimer"
        destructive
      />
    </PageContainer>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-2 shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}
