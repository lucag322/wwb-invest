"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PageContainer } from "@/components/shared/page-container";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TaskForm } from "@/features/tasks/components/task-form";
import { RichTextContent } from "@/components/shared/rich-text-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { TASK_STATUSES } from "@/lib/constants";
import { toast } from "sonner";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calendar,
  Building2,
  Clock,
  AlertTriangle,
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

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-zinc-500/15 text-zinc-400",
  in_progress: "bg-blue-500/15 text-blue-400",
  done: "bg-green-500/15 text-green-400",
};

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-yellow-400",
  low: "bg-green-400",
};

const PRIORITY_LABELS: Record<string, string> = {
  high: "Haute",
  medium: "Moyenne",
  low: "Basse",
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

  async function saveField(field: string, value: string) {
    mutate({ ...task!, [field]: value }, { revalidate: false });
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
  }

  async function updateStatus(v: string | null) {
    if (!v) return;
    const prev = task!.status;
    mutate({ ...task!, status: v }, { revalidate: false });
    const res = await fetch(`/api/tasks/${task!.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: v }),
    });
    if (res.ok) {
      toast.success("Statut mis à jour");
      mutate();
    } else {
      mutate({ ...task!, status: prev }, { revalidate: false });
      toast.error("Erreur lors de la mise à jour");
    }
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

  const hasContent = task.description || task.notes;

  return (
    <PageContainer>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Tâches
      </Button>

      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="flex">
          {/* Priority accent bar */}
          <div className={`w-1 shrink-0 ${PRIORITY_DOT[task.priority] || "bg-zinc-500"}`} />

          <div className="flex-1 p-5 md:p-6">
            {/* Top row: badges + actions */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={task.status} onValueChange={updateStatus}>
                  <SelectTrigger
                    className={`h-7 w-auto gap-1.5 border-0 px-2.5 text-xs font-medium ${STATUS_COLORS[task.status] || ""}`}
                  >
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
                <Badge variant="secondary" className="text-xs">
                  {CATEGORY_LABELS[task.category] || task.category}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className={`h-2 w-2 rounded-full ${PRIORITY_DOT[task.priority] || "bg-zinc-500"}`}
                  />
                  {PRIORITY_LABELS[task.priority] || task.priority}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
              {task.title}
            </h1>

            {/* Meta row */}
            <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-muted-foreground">
              {task.dueDate && (
                <div
                  className={`flex items-center gap-1.5 ${isOverdue ? "text-destructive" : ""}`}
                >
                  {isOverdue ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <Calendar className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {formatDate(task.dueDate)}
                    {isOverdue && " — en retard"}
                  </span>
                </div>
              )}
              {task.deal && (
                <Link
                  href={`/deals/${task.deal.id}`}
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {task.deal.name}
                </Link>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Créée le {formatDate(task.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Content sections */}
      {hasContent ? (
        <Card>
          <CardContent className="p-5 md:p-6 space-y-0">
            {task.description && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Description
                </h3>
                <RichTextContent
                  content={task.description}
                  onCheckToggle={(html) => saveField("description", html)}
                />
              </div>
            )}

            {task.description && task.notes && (
              <Separator className="my-5" />
            )}

            {task.notes && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Notes
                </h3>
                <RichTextContent
                  content={task.notes}
                  className="text-muted-foreground"
                  onCheckToggle={(html) => saveField("notes", html)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-sm text-muted-foreground text-center">
              Aucune description ni note —{" "}
              <button
                onClick={() => setEditing(true)}
                className="text-primary hover:underline"
              >
                ajouter du contenu
              </button>
            </p>
          </CardContent>
        </Card>
      )}

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
