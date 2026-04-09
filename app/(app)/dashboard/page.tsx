"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Target,
  Building2,
  Search,
  FileText,
  Wallet,
  TrendingUp,
  DollarSign,
  ListTodo,
  ArrowRight,
  CheckSquare,
  Settings2,
  X,
  Pencil,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DashboardData {
  cashFlowTarget: number;
  widgetConfig: Record<string, boolean>;
  totalDeals: number;
  offersCount: number;
  boughtCount: number;
  inProgressTasks: number;
  todoTasks: number;
  totalCashFlow: number;
  availableDeposit: number;
  borrowingCapacity: number;
  maxMonthlyPayment: number;
  recentDeals: Array<{
    id: string;
    name: string;
    city: string;
    price: number;
    status: string;
    createdAt: string;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    priority: string;
    status: string;
    category: string;
    dueDate: string | null;
  }>;
}

const DEAL_STATUS_LABELS: Record<string, string> = {
  a_analyser: "À analyser",
  interessant: "Intéressant",
  visite_prevue: "Visite prévue",
  visite: "Visité",
  offre_faite: "Offre faite",
  refuse: "Refusé",
  achete: "Acheté",
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

type EditableField = {
  api: "dashboard" | "finance";
  field: string;
};

interface KpiDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  getValue: (data: DashboardData) => string;
  getRawValue: (data: DashboardData) => number;
  description?: string;
  editable?: EditableField;
  isCurrency?: boolean;
}

const ALL_KPIS: KpiDefinition[] = [
  {
    id: "cashFlowTarget",
    label: "Objectif Cash Flow",
    icon: Target,
    getValue: (d) => formatCurrency(d.cashFlowTarget),
    getRawValue: (d) => d.cashFlowTarget,
    description: "par mois",
    editable: { api: "dashboard", field: "cashFlowTarget" },
    isCurrency: true,
  },
  {
    id: "totalCashFlow",
    label: "Cash Flow Estimé",
    icon: DollarSign,
    getValue: (d) => formatCurrency(d.totalCashFlow),
    getRawValue: (d) => d.totalCashFlow,
    description: "par mois",
    isCurrency: true,
  },
  {
    id: "totalDeals",
    label: "Deals Analysés",
    icon: Search,
    getValue: (d) => String(d.totalDeals),
    getRawValue: (d) => d.totalDeals,
  },
  {
    id: "offersCount",
    label: "Offres Faites",
    icon: FileText,
    getValue: (d) => String(d.offersCount),
    getRawValue: (d) => d.offersCount,
  },
  {
    id: "boughtCount",
    label: "Biens Achetés",
    icon: Building2,
    getValue: (d) => String(d.boughtCount),
    getRawValue: (d) => d.boughtCount,
  },
  {
    id: "availableDeposit",
    label: "Apport Disponible",
    icon: Wallet,
    getValue: (d) => formatCurrency(d.availableDeposit),
    getRawValue: (d) => d.availableDeposit,
    editable: { api: "finance", field: "availableDeposit" },
    isCurrency: true,
  },
  {
    id: "borrowingCapacity",
    label: "Capacité Emprunt",
    icon: TrendingUp,
    getValue: (d) => formatCurrency(d.borrowingCapacity),
    getRawValue: (d) => d.borrowingCapacity,
    editable: { api: "finance", field: "borrowingCapacity" },
    isCurrency: true,
  },
  {
    id: "maxMonthlyPayment",
    label: "Mensualité Max",
    icon: Wallet,
    getValue: (d) => formatCurrency(d.maxMonthlyPayment),
    getRawValue: (d) => d.maxMonthlyPayment,
    description: "par mois",
    editable: { api: "finance", field: "maxMonthlyPayment" },
    isCurrency: true,
  },
  {
    id: "activeTasks",
    label: "Tâches en cours",
    icon: ListTodo,
    getValue: (d) => String(d.inProgressTasks + d.todoTasks),
    getRawValue: (d) => d.inProgressTasks + d.todoTasks,
  },
];

const ALL_SECTIONS = [
  { id: "chart", label: "Graphique Cash Flow" },
  { id: "recentTasks", label: "Tâches récentes" },
  { id: "recentDeals", label: "Derniers deals" },
  { id: "quickAccess", label: "Accès rapides" },
];

function getDefaultConfig(): Record<string, boolean> {
  const config: Record<string, boolean> = {};
  ALL_KPIS.forEach((k) => (config[`kpi_${k.id}`] = true));
  ALL_SECTIONS.forEach((s) => (config[`section_${s.id}`] = true));
  return config;
}

function isWidgetVisible(
  config: Record<string, boolean>,
  key: string
): boolean {
  return config[key] !== false;
}

function parseNumber(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function EditableKpiCard({
  kpi,
  data,
  onSave,
}: {
  kpi: KpiDefinition;
  data: DashboardData;
  onSave: (kpi: KpiDefinition, value: number) => Promise<void>;
}) {
  const [editMode, setEditMode] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const committedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const Icon = kpi.icon;
  const displayValue = kpi.getValue(data);
  const isEditable = !!kpi.editable;

  function startEdit() {
    if (!isEditable) return;
    const raw = kpi.getRawValue(data);
    setInputValue(raw === 0 ? "" : String(raw));
    committedRef.current = false;
    setEditMode(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  async function commitEdit() {
    if (committedRef.current || saving) return;
    committedRef.current = true;

    const newValue = Math.max(0, parseNumber(inputValue));
    setSaving(true);
    try {
      await onSave(kpi, newValue);
      toast.success(`${kpi.label} mis à jour`);
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
      setEditMode(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      committedRef.current = true;
      setEditMode(false);
    }
  }

  return (
    <Card
      className={cn(
        "group relative",
        isEditable && !editMode && "cursor-pointer hover:border-primary/40 transition-colors"
      )}
      onClick={() => !editMode && startEdit()}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {kpi.label}
            </p>

            {editMode ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  ref={inputRef}
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKeyDown}
                  disabled={saving}
                  className="h-9 text-lg font-bold font-mono w-full"
                  placeholder="0"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ) : (
              <p className="text-2xl font-bold">{displayValue}</p>
            )}

            {kpi.description && !editMode && (
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-2.5 relative">
            <Icon className="h-5 w-5 text-primary" />
            {isEditable && !editMode && (
              <Pencil className="h-3 w-3 text-primary absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomBarTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold font-mono">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [editing, setEditing] = useState(false);
  const [widgetConfig, setWidgetConfig] = useState<Record<string, boolean>>(
    getDefaultConfig()
  );
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d: DashboardData) => {
        setData(d);
        const merged = { ...getDefaultConfig(), ...d.widgetConfig };
        setWidgetConfig(merged);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveConfig = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/dashboard", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgetConfig }),
      });
      toast.success("Dashboard sauvegardé");
      setEditing(false);
      fetchData();
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }, [widgetConfig, fetchData]);

  const handleKpiSave = useCallback(
    async (kpi: KpiDefinition, value: number) => {
      if (!kpi.editable) return;

      setData((prev) =>
        prev ? { ...prev, [kpi.editable!.field]: value } : prev
      );

      if (kpi.editable.api === "dashboard") {
        await fetch("/api/dashboard", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [kpi.editable.field]: value }),
        });
      } else if (kpi.editable.api === "finance") {
        await fetch("/api/finance/overview", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [kpi.editable.field]: value }),
        });
      }

      fetchData();
    },
    [fetchData]
  );

  const toggleWidget = (key: string) => {
    setWidgetConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!data) {
    return (
      <PageContainer>
        <PageHeader
          title="Dashboard"
          description="Vue d'ensemble de vos investissements"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    );
  }

  const chartData = [
    { name: "Objectif", value: data.cashFlowTarget },
    { name: "Actuel", value: data.totalCashFlow },
  ];

  const visibleKpis = ALL_KPIS.filter((k) =>
    isWidgetVisible(widgetConfig, `kpi_${k.id}`)
  );

  const showChart = isWidgetVisible(widgetConfig, "section_chart");
  const showTasks = isWidgetVisible(widgetConfig, "section_recentTasks");

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Vue d'ensemble de vos investissements"
        action={
          editing ? (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setWidgetConfig({
                    ...getDefaultConfig(),
                    ...data.widgetConfig,
                  });
                  setEditing(false);
                }}
              >
                <X className="h-4 w-4 mr-1" /> Annuler
              </Button>
              <Button size="sm" onClick={saveConfig} disabled={saving}>
                {saving ? "..." : "Sauvegarder"}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Settings2 className="h-4 w-4 mr-1" /> Personnaliser
            </Button>
          )
        }
      />

      {editing && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Choisir les éléments à afficher
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                KPIs
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_KPIS.map((kpi) => (
                  <div
                    key={kpi.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <Switch
                      id={`kpi_${kpi.id}`}
                      checked={isWidgetVisible(
                        widgetConfig,
                        `kpi_${kpi.id}`
                      )}
                      onCheckedChange={() => toggleWidget(`kpi_${kpi.id}`)}
                    />
                    <Label
                      htmlFor={`kpi_${kpi.id}`}
                      className="text-xs cursor-pointer"
                    >
                      {kpi.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                Sections
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ALL_SECTIONS.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <Switch
                      id={`section_${section.id}`}
                      checked={isWidgetVisible(
                        widgetConfig,
                        `section_${section.id}`
                      )}
                      onCheckedChange={() =>
                        toggleWidget(`section_${section.id}`)
                      }
                    />
                    <Label
                      htmlFor={`section_${section.id}`}
                      className="text-xs cursor-pointer"
                    >
                      {section.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {visibleKpis.length > 0 && (
        <div
          className={cn(
            "grid gap-4",
            visibleKpis.length === 1 && "grid-cols-1",
            visibleKpis.length === 2 && "grid-cols-2",
            visibleKpis.length === 3 && "grid-cols-2 lg:grid-cols-3",
            visibleKpis.length >= 4 && "grid-cols-2 lg:grid-cols-4"
          )}
        >
          {visibleKpis.map((kpi) => (
            <EditableKpiCard
              key={kpi.id}
              kpi={kpi}
              data={data}
              onSave={handleKpiSave}
            />
          ))}
        </div>
      )}

      <div
        className={cn(
          "grid gap-6",
          showChart && showTasks ? "lg:grid-cols-2" : "grid-cols-1"
        )}
      >
        {showChart && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Cash Flow: Objectif vs Actuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                    />
                    <XAxis
                      dataKey="name"
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="rgba(255,255,255,0.4)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) =>
                        new Intl.NumberFormat("fr-FR", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        }).format(v)
                      }
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar
                      dataKey="value"
                      fill="#818cf8"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {showTasks && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">
                Tâches récentes
              </CardTitle>
              <Link href="/tasks">
                <Button variant="ghost" size="sm">
                  Voir tout <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data.recentTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Aucune tâche en cours
                </p>
              ) : (
                <div className="space-y-3">
                  {data.recentTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <CheckSquare
                        className={`h-4 w-4 ${PRIORITY_COLORS[task.priority] || "text-muted-foreground"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {task.title}
                        </p>
                        {task.dueDate && (
                          <p className="text-xs text-muted-foreground">
                            {formatDate(task.dueDate)}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {task.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {isWidgetVisible(widgetConfig, "section_recentDeals") && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">
              Derniers deals
            </CardTitle>
            <Link href="/deals">
              <Button variant="ghost" size="sm">
                Voir tout <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentDeals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Aucun deal pour le moment
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.recentDeals.map((deal) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`}>
                    <div className="rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors">
                      <p className="font-medium text-sm">{deal.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {deal.city}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-semibold font-mono">
                          {formatCurrency(deal.price)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {DEAL_STATUS_LABELS[deal.status] || deal.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {isWidgetVisible(widgetConfig, "section_quickAccess") && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: "/tasks", label: "Tâches", icon: ListTodo },
            { href: "/deals", label: "Deals", icon: Building2 },
            { href: "/calculator", label: "Calculateur", icon: Target },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
                  <link.icon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
