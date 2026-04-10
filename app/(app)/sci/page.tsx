"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Save,
  Pencil,
  Scale,
  CheckSquare,
  Users,
  PieChart,
  FileText,
  ArrowRight,
  Building,
  Plus,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SCIInfo {
  name: string;
  associates: string;
  distribution: string;
  taxRegime: string;
  legalNotes: string;
  nextSteps: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  dueDate: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

export default function SCIPage() {
  const { data: sciData, mutate: mutateSci } = useSWR<{ info: SCIInfo }>("/api/sci", fetcher);
  const { data: allTasks = [] } = useSWR<Task[]>("/api/tasks", fetcher);
  const [info, setInfo] = useState<SCIInfo>({
    name: "",
    associates: "",
    distribution: "",
    taxRegime: "IS",
    legalNotes: "",
    nextSteps: "",
  });
  const [infoSynced, setInfoSynced] = useState(false);
  const [editing, setEditing] = useState(false);

  if (sciData?.info && !infoSynced) {
    setInfo(sciData.info);
    setInfoSynced(true);
  }

  const tasks = useMemo(() => allTasks.filter((t) => t.category === "sci"), [allTasks]);

  async function saveInfo() {
    await fetch("/api/sci", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "info", ...info }),
    });
    toast.success("Informations SCI mises à jour");
    setEditing(false);
    setInfoSynced(false);
    mutateSci();
  }

  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const progress = tasks.length > 0 ? (doneTasks / tasks.length) * 100 : 0;

  return (
    <PageContainer>
      <PageHeader
        title="SCI & Juridique"
        description="Gestion de votre Société Civile Immobilière"
        action={
          !editing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-1" /> Modifier
            </Button>
          ) : undefined
        }
      />

      {editing ? (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Modifier les informations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Nom de la SCI
                  </Label>
                  <Input
                    value={info.name}
                    onChange={(e) =>
                      setInfo({ ...info, name: e.target.value })
                    }
                    placeholder="Ex: SCI WWB Investissement"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Régime fiscal
                  </Label>
                  <Select
                    value={info.taxRegime}
                    onValueChange={(v) => {
                      if (v !== null) setInfo({ ...info, taxRegime: v });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IS">
                        IS (Impôt sur les sociétés)
                      </SelectItem>
                      <SelectItem value="IR">
                        IR (Impôt sur le revenu)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Associés
                  </Label>
                  <Input
                    value={info.associates}
                    onChange={(e) =>
                      setInfo({ ...info, associates: e.target.value })
                    }
                    placeholder="Ex: Jean Dupont, Marie Dupont"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Répartition
                  </Label>
                  <Input
                    value={info.distribution}
                    onChange={(e) =>
                      setInfo({ ...info, distribution: e.target.value })
                    }
                    placeholder="Ex: 50% / 50%"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Notes juridiques
                </Label>
                <Textarea
                  value={info.legalNotes}
                  onChange={(e) =>
                    setInfo({ ...info, legalNotes: e.target.value })
                  }
                  rows={3}
                  placeholder="Informations juridiques importantes..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Prochaines étapes
                </Label>
                <Textarea
                  value={info.nextSteps}
                  onChange={(e) =>
                    setInfo({ ...info, nextSteps: e.target.value })
                  }
                  rows={2}
                  placeholder="Actions à venir..."
                />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={saveInfo}>
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
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Building className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Nom
                    </p>
                    <p className="text-sm font-semibold mt-0.5 truncate">
                      {info.name || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Scale className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Régime
                    </p>
                    <div className="mt-0.5">
                      <Badge
                        variant="secondary"
                        className="text-sm font-semibold"
                      >
                        {info.taxRegime}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Associés
                    </p>
                    <p className="text-sm font-semibold mt-0.5 truncate">
                      {info.associates || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <PieChart className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Répartition
                    </p>
                    <p className="text-sm font-semibold mt-0.5 truncate">
                      {info.distribution || "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {info.legalNotes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    Notes juridiques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {info.legalNotes}
                  </p>
                </CardContent>
              </Card>
            )}
            {info.nextSteps && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                    <ArrowRight className="h-3.5 w-3.5" />
                    Prochaines étapes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {info.nextSteps}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Tâches SCI
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-mono">
                {doneTasks}/{tasks.length}
              </Badge>
              <Link href="/tasks?category=sci">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Ajouter
                </Button>
              </Link>
            </div>
          </div>
          {tasks.length > 0 && (
            <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">
                Aucune tâche SCI
              </p>
              <Link href="/tasks?category=sci">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Créer une tâche SCI
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
                >
                  <CheckSquare
                    className={`h-4 w-4 shrink-0 ${
                      task.status === "done"
                        ? "text-muted-foreground"
                        : PRIORITY_COLORS[task.priority] ||
                          "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${task.status === "done" ? "line-through text-muted-foreground" : "font-medium"}`}
                    >
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        {formatDate(task.dueDate)}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      task.status === "done" ? "secondary" : "outline"
                    }
                    className="text-xs shrink-0"
                  >
                    {STATUS_LABELS[task.status] || task.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
