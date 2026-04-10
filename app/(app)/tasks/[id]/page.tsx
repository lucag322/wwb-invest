"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TaskForm } from "@/features/tasks/components/task-form";
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
import { formatDate } from "@/lib/utils";
import { TASK_STATUSES, TASK_CATEGORIES } from "@/lib/constants";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Flag,
  Calendar,
  Tag,
  FileText,
  StickyNote,
  Building2,
  CheckCircle2,
} from "lucide-react";
import type { TaskFormData } from "@/types";

interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  category: string;
  dueDate: string | null;
  notes: string | null;
  dealId: string | null;
  createdAt: string;
  updatedAt: string;
  deal?: { id: string; name: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/15 text-green-400 border-green-500/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  banque: "Banque",
  deals: "Deals",
  sci: "SCI",
  juridique: "Juridique",
  admin: "Admin",
  visite: "Visite",
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: task, mutate } = useSWR<TaskDetail>(
    id ? `/api/tasks/${id}` : null,
    fetcher
  );
  const { data: rawDeals = [] } = useSWR<Array<{ id: string; name: string }>>(
    "/api/deals",
    fetcher
  );
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function handleUpdate(data: TaskFormData) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Tâche modifiée");
      setEditing(false);
      mutate();
    } else {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function handleDelete() {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    toast.success("Tâche supprimée");
    router.push("/tasks");
  }

  if (!task) {
    return (
      <PageContainer>
        <div className="h-64 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </PageContainer>
    );
  }

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "done";

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
        title={task.title}
        description={STATUS_LABELS[task.status] || task.status}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
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
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Détails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={CheckCircle2} label="Statut">
              <Select
                value={task.status}
                onValueChange={async (v) => {
                  if (v === null) return;
                  const prev = task.status;
                  mutate({ ...task, status: v }, { revalidate: false });
                  const res = await fetch(`/api/tasks/${task.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: v }),
                  });
                  if (res.ok) {
                    toast.success("Statut mis à jour");
                    mutate();
                  } else {
                    mutate({ ...task, status: prev }, { revalidate: false });
                    toast.error("Erreur lors de la mise à jour");
                  }
                }}
              >
                <SelectTrigger className="w-36 h-8 text-xs">
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
            </InfoRow>

            <InfoRow icon={Flag} label="Priorité">
              <Badge
                variant="outline"
                className={`text-xs ${PRIORITY_COLORS[task.priority]}`}
              >
                {PRIORITY_LABELS[task.priority] || task.priority}
              </Badge>
            </InfoRow>

            <InfoRow icon={Tag} label="Catégorie">
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[task.category] || task.category}
              </Badge>
            </InfoRow>

            {task.dueDate && (
              <InfoRow icon={Calendar} label="Échéance">
                <span
                  className={`text-sm font-medium ${isOverdue ? "text-destructive" : ""}`}
                >
                  {formatDate(task.dueDate)}
                  {isOverdue && " (en retard)"}
                </span>
              </InfoRow>
            )}

            {task.deal && (
              <InfoRow icon={Building2} label="Deal lié">
                <Link
                  href={`/deals/${task.deal.id}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {task.deal.name}
                </Link>
              </InfoRow>
            )}

            <InfoRow icon={Calendar} label="Créée le">
              <span className="text-sm font-medium">
                {formatDate(task.createdAt)}
              </span>
            </InfoRow>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {task.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              </CardContent>
            </Card>
          )}

          {task.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <StickyNote className="h-4 w-4" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {task.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {!task.description && !task.notes && (
            <Card>
              <CardContent className="py-8">
                <p className="text-sm text-muted-foreground text-center">
                  Aucune description ni note pour cette tâche
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {editing && (
        <TaskForm
          open={editing}
          onOpenChange={(open) => {
            if (!open) setEditing(false);
          }}
          onSubmit={handleUpdate}
          initialData={{
            ...task,
            id: task.id,
            dueDate: task.dueDate || undefined,
            description: task.description || undefined,
            notes: task.notes || undefined,
            dealId: task.dealId || undefined,
          } as Partial<TaskFormData> & { id: string }}
          deals={rawDeals.map((d) => ({ id: d.id, name: d.name }))}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer la tâche"
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
