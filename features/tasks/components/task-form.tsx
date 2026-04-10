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
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_CATEGORIES,
} from "@/lib/constants";
import {
  Flag,
  ListChecks,
  Tag,
  CalendarDays,
  Building2,
  StickyNote,
  AlignLeft,
} from "lucide-react";
import type { TaskFormData } from "@/types";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData> & { id?: string };
  deals?: Array<{ id: string; name: string }>;
}

const PRIORITY_INDICATORS: Record<string, { color: string; dot: string }> = {
  low: { color: "text-blue-400", dot: "bg-blue-400" },
  medium: { color: "text-yellow-400", dot: "bg-yellow-400" },
  high: { color: "text-red-400", dot: "bg-red-400" },
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

export function TaskForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  deals = [],
}: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
    category: "admin",
    dueDate: "",
    notes: "",
    dealId: "",
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || "",
        description: initialData.description || "",
        priority: initialData.priority || "medium",
        status: initialData.status || "todo",
        category: initialData.category || "admin",
        dueDate: initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : "",
        notes: initialData.notes || "",
        dealId: initialData.dealId || "",
      });
    } else {
      setForm({
        title: "",
        description: "",
        priority: "medium",
        status: "todo",
        category: "admin",
        dueDate: "",
        notes: "",
        dealId: "",
      });
    }
  }, [initialData, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      ...form,
      dealId: form.dealId || undefined,
      dueDate: form.dueDate || undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {initialData?.id ? "Modifier la tâche" : "Nouvelle tâche"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <Label>
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Appeler le courtier pour le dossier"
              required
            />
          </div>

          {/* Description */}
          <div>
            <SectionTitle icon={AlignLeft}>Description</SectionTitle>
            <div className="mt-1">
              <RichTextEditor
                content={form.description || ""}
                onChange={(html) => setForm({ ...form, description: html })}
                placeholder="Détails de la tâche..."
              />
            </div>
          </div>

          {/* Status & Priority */}
          <div>
            <SectionTitle icon={Flag}>Gestion</SectionTitle>
            <div className="grid grid-cols-3 gap-3 mt-1">
              <div className="space-y-1.5">
                <Label className="text-xs">Priorité</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => {
                    if (v !== null)
                      setForm({
                        ...form,
                        priority: v as TaskFormData["priority"],
                      });
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${PRIORITY_INDICATORS[p.value]?.dot}`}
                          />
                          {p.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Statut</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => {
                    if (v !== null)
                      setForm({
                        ...form,
                        status: v as TaskFormData["status"],
                      });
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Catégorie</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => {
                    if (v !== null)
                      setForm({
                        ...form,
                        category: v as TaskFormData["category"],
                      });
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Date & Deal */}
          <div>
            <SectionTitle icon={CalendarDays}>Planification</SectionTitle>
            <div
              className={`grid gap-3 mt-1 ${deals.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              <div className="space-y-1.5">
                <Label className="text-xs">Échéance</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({ ...form, dueDate: e.target.value })
                  }
                  className="text-xs"
                />
              </div>
              {deals.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Deal lié
                  </Label>
                  <Select
                    value={form.dealId || "none"}
                    onValueChange={(v) => {
                      if (v !== null)
                        setForm({ ...form, dealId: v === "none" ? "" : v });
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Aucun" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                      {deals.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <SectionTitle icon={StickyNote}>Notes</SectionTitle>
            <div className="mt-1">
              <RichTextEditor
                content={form.notes || ""}
                onChange={(html) => setForm({ ...form, notes: html })}
                placeholder="Remarques, liens utiles..."
              />
            </div>
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
