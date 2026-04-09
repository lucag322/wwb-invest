"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TaskForm } from "@/features/tasks/components/task-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/utils";
import { TASK_CATEGORIES, TASK_STATUSES } from "@/lib/constants";
import { toast } from "sonner";
import {
  Plus,
  ListTodo,
  MoreVertical,
  Pencil,
  Trash2,
  Kanban,
  List,
  AlertCircle,
} from "lucide-react";
import type { TaskFormData } from "@/types";

interface Task {
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
  deal?: { id: string; name: string } | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/15 text-green-400 border-green-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

export default function TasksPage() {
  return (
    <Suspense>
      <TasksContent />
    </Suspense>
  );
}

function TasksContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const dealIdParam = searchParams.get("dealId");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState(categoryParam || "all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [formOpen, setFormOpen] = useState(!!dealIdParam);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deals, setDeals] = useState<Array<{ id: string; name: string }>>([]);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
    fetch("/api/deals")
      .then((r) => r.json())
      .then((d) => setDeals(d.map((deal: { id: string; name: string }) => ({ id: deal.id, name: deal.name }))));
  }, [fetchTasks]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (filterCategory !== "all" && t.category !== filterCategory)
        return false;
      if (filterStatus !== "all" && t.status !== filterStatus) return false;
      return true;
    });
  }, [tasks, search, filterCategory, filterStatus]);

  async function handleCreate(data: TaskFormData) {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Tâche créée");
      fetchTasks();
    }
  }

  async function handleUpdate(data: TaskFormData) {
    if (!editingTask) return;
    const res = await fetch(`/api/tasks/${editingTask.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      toast.success("Tâche modifiée");
      setEditingTask(null);
      fetchTasks();
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/tasks/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Tâche supprimée");
      setDeleteId(null);
      fetchTasks();
    }
  }

  async function toggleDone(task: Task) {
    const newStatus = task.status === "done" ? "todo" : "done";
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  }

  if (loading) {
    return (
      <PageContainer>
        <PageHeader title="Tâches" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Tâches"
        description={`${tasks.filter((t) => t.status !== "done").length} tâche(s) en cours`}
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nouvelle tâche
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher une tâche..."
          />
        </div>
        <Select
          value={filterCategory}
          onValueChange={(v) => {
            if (v !== null) setFilterCategory(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            {TASK_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(v) => {
            if (v !== null) setFilterStatus(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "list" | "kanban")}
        >
          <TabsList>
            <TabsTrigger value="list">
              <List className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <Kanban className="h-4 w-4" />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Aucune tâche"
          description="Commencez par créer votre première tâche"
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Créer une tâche
            </Button>
          }
        />
      ) : view === "list" ? (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors"
            >
              <Checkbox
                checked={task.status === "done"}
                onCheckedChange={() => toggleDone(task)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-medium ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}
                  >
                    {task.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${PRIORITY_COLORS[task.priority]}`}
                  >
                    {task.priority}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {task.category}
                  </Badge>
                </div>
                {task.dueDate && (
                  <div className="flex items-center gap-1 mt-1">
                    {new Date(task.dueDate) < new Date() &&
                      task.status !== "done" && (
                        <AlertCircle className="h-3 w-3 text-destructive" />
                      )}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg h-8 w-8 hover:bg-muted transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      setEditingTask(task);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" /> Modifier
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDeleteId(task.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {(["todo", "in_progress", "done"] as const).map((status) => (
            <Card key={status}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {STATUS_LABELS[status]}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {filtered.filter((t) => t.status === status).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {filtered
                  .filter((t) => t.status === status)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-border p-3 space-y-2 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium">
                          {task.title}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-lg h-6 w-6 hover:bg-muted transition-colors">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditingTask(task)}
                            >
                              <Pencil className="h-4 w-4 mr-2" /> Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteId(task.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs ${PRIORITY_COLORS[task.priority]}`}
                        >
                          {task.priority}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {task.category}
                        </Badge>
                      </div>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                  ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleCreate}
        deals={deals}
        initialData={
          dealIdParam
            ? { dealId: dealIdParam, category: "deals" as TaskFormData["category"] }
            : categoryParam
              ? { category: categoryParam as TaskFormData["category"] }
              : undefined
        }
      />

      {editingTask && (
        <TaskForm
          open={!!editingTask}
          onOpenChange={(open) => {
            if (!open) setEditingTask(null);
          }}
          onSubmit={handleUpdate}
          initialData={{
            ...editingTask,
            id: editingTask.id,
            dueDate: editingTask.dueDate || undefined,
            description: editingTask.description || undefined,
            notes: editingTask.notes || undefined,
            dealId: editingTask.dealId || undefined,
          } as Partial<TaskFormData> & { id: string }}
          deals={deals}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        title="Supprimer la tâche"
        description="Cette action est irréversible."
        onConfirm={handleDelete}
        confirmLabel="Supprimer"
        destructive
      />
    </PageContainer>
  );
}
