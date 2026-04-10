"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { KpiCard } from "@/components/shared/kpi-card";
import { CurrencyInput } from "@/components/shared/currency-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  calculateProjectCost,
  formatCurrency,
  formatPercent,
} from "@/lib/calculations";
import { DEFAULT_CALCULATOR_INPUTS } from "@/lib/constants";
import type { CalculatorInputs } from "@/types";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Home,
  Wallet,
  TrendingUp,
  DollarSign,
  Percent,
  CreditCard,
  Save,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

const CHART_COLORS = [
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#38bdf8",
  "#fb923c",
];

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-muted-foreground">{item.name}</p>
      <p className="text-sm font-semibold">{formatCurrency(item.value)}</p>
    </div>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense>
      <CalculatorContent />
    </Suspense>
  );
}

function CalculatorContent() {
  const searchParams = useSearchParams();
  const [inputs, setInputs] = useState<CalculatorInputs>(
    DEFAULT_CALCULATOR_INPUTS
  );
  const { data: savedDefaultsRaw, mutate: mutateDefaults } = useSWR<Partial<CalculatorInputs>>(
    "/api/calculator/defaults",
    fetcher
  );
  const savedDefaults = useMemo(() => {
    if (savedDefaultsRaw && typeof savedDefaultsRaw === "object" && !("error" in savedDefaultsRaw)) {
      return Object.keys(savedDefaultsRaw).length > 0 ? savedDefaultsRaw : {};
    }
    return {};
  }, [savedDefaultsRaw]);
  const [dealName, setDealName] = useState<string | null>(null);
  const [defaultsApplied, setDefaultsApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const loaded = savedDefaultsRaw !== undefined;

  useEffect(() => {
    if (!loaded || defaultsApplied) return;
    setDefaultsApplied(true);

    const price = searchParams.get("price");
    const rent = searchParams.get("rent");
    const name = searchParams.get("name");

    if (price || rent) {
      setInputs((prev) => ({
        ...prev,
        ...savedDefaults,
        ...(price ? { propertyPrice: Number(price) } : {}),
        ...(rent ? { monthlyRentHC: Number(rent) } : {}),
      }));
      if (name) setDealName(name);
    } else if (Object.keys(savedDefaults).length > 0) {
      setInputs((prev) => ({ ...prev, ...savedDefaults }));
    }
  }, [loaded, defaultsApplied, searchParams, savedDefaults]);

  const results = useMemo(() => calculateProjectCost(inputs), [inputs]);

  function update(key: keyof CalculatorInputs, value: number) {
    setInputs((prev) => ({ ...prev, [key]: value }));
  }

  async function saveAsDefaults() {
    setSaving(true);
    try {
      await fetch("/api/calculator/defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      mutateDefaults(inputs, { revalidate: false });
      toast.success("Valeurs par défaut sauvegardées");
    } catch {
      toast.error("Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    const base = {
      ...DEFAULT_CALCULATOR_INPUTS,
      ...savedDefaults,
    };
    setInputs(base);
    setDealName(null);
    toast.success("Valeurs réinitialisées");
  }

  const pieData = results.costBreakdown.filter((item) => item.value > 0);

  if (!loaded) {
    return (
      <PageContainer>
        <PageHeader title="Calculateur" />
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="h-32 animate-pulse bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Calculateur"
        description={
          dealName
            ? `Simulation pour "${dealName}"`
            : "Simulez le coût total d'un projet immobilier"
        }
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Réinitialiser
            </Button>
            <Button
              size="sm"
              onClick={saveAsDefaults}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-1" />
              {saving ? "..." : "Sauvegarder comme défaut"}
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Bien & Financement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CurrencyInput
                label="Prix du bien"
                value={inputs.propertyPrice}
                onChange={(v) => update("propertyPrice", v)}
                suffix="€"
                step={1000}
              />
              <CurrencyInput
                label="Apport"
                value={inputs.deposit}
                onChange={(v) => update("deposit", v)}
                suffix="€"
                step={1000}
              />
              <div className="grid grid-cols-2 gap-3">
                <CurrencyInput
                  label="Taux d'intérêt"
                  value={inputs.interestRate}
                  onChange={(v) => update("interestRate", v)}
                  suffix="%"
                  step={0.1}
                  decimals
                />
                <CurrencyInput
                  label="Durée (années)"
                  value={inputs.loanDuration}
                  onChange={(v) => update("loanDuration", v)}
                  suffix="ans"
                />
              </div>
              <CurrencyInput
                label="Travaux"
                value={inputs.renovationCost}
                onChange={(v) => update("renovationCost", v)}
                suffix="€"
                step={500}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Frais (%)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <CurrencyInput
                  label="Notaire"
                  value={inputs.notaryFeesPercent}
                  onChange={(v) => update("notaryFeesPercent", v)}
                  suffix="%"
                  step={0.1}
                  decimals
                />
                <CurrencyInput
                  label="Banque"
                  value={inputs.bankFeesPercent}
                  onChange={(v) => update("bankFeesPercent", v)}
                  suffix="%"
                  step={0.1}
                  decimals
                />
                <CurrencyInput
                  label="Courtier"
                  value={inputs.brokerFeesPercent}
                  onChange={(v) => update("brokerFeesPercent", v)}
                  suffix="%"
                  step={0.1}
                  decimals
                />
                <CurrencyInput
                  label="SCI / Divers"
                  value={inputs.sciFeesPercent}
                  onChange={(v) => update("sciFeesPercent", v)}
                  suffix="%"
                  step={0.1}
                  decimals
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Revenus & Charges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CurrencyInput
                label="Loyers mensuels HC"
                value={inputs.monthlyRentHC}
                onChange={(v) => update("monthlyRentHC", v)}
                suffix="€/mois"
                step={50}
              />
              <CurrencyInput
                label="Taxe foncière annuelle"
                value={inputs.annualPropertyTax}
                onChange={(v) => update("annualPropertyTax", v)}
                suffix="€/an"
                step={100}
              />
              <CurrencyInput
                label="Charges annuelles"
                value={inputs.annualCharges}
                onChange={(v) => update("annualCharges", v)}
                suffix="€/an"
                step={100}
              />
              <CurrencyInput
                label="Vacance locative annuelle"
                value={inputs.annualVacancy}
                onChange={(v) => update("annualVacancy", v)}
                suffix="€/an"
                step={100}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <KpiCard
              title="Coût Total Projet"
              value={formatCurrency(results.totalProjectCost)}
              icon={Home}
            />
            <KpiCard
              title="Montant à Emprunter"
              value={formatCurrency(results.loanAmount)}
              icon={CreditCard}
            />
            <KpiCard
              title="Mensualité"
              value={formatCurrency(results.monthlyPayment)}
              icon={Wallet}
              description="par mois"
            />
            <KpiCard
              title="Cash Flow Mensuel"
              value={formatCurrency(results.monthlyCashFlow)}
              icon={DollarSign}
              description={
                results.monthlyCashFlow >= 0 ? "positif" : "négatif"
              }
            />
            <KpiCard
              title="Rendement Brut"
              value={formatPercent(results.grossYield)}
              icon={TrendingUp}
            />
            <KpiCard
              title="Rendement Net"
              value={formatPercent(results.netYield)}
              icon={Percent}
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Répartition du coût total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={<CustomTooltip />}
                      wrapperStyle={{ zIndex: 100 }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => (
                        <span className="text-xs text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Élément</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.costBreakdown.map((item) => (
                    <TableRow key={item.label}>
                      <TableCell className="text-sm">{item.label}</TableCell>
                      <TableCell className="text-right text-sm font-mono">
                        {formatCurrency(item.value)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground font-mono">
                        {item.percent.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(results.totalProjectCost)}
                    </TableCell>
                    <TableCell className="text-right font-mono">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Coût total du crédit
                  </span>
                  <span className="font-mono">
                    {formatCurrency(results.totalCreditCost)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Intérêts totaux
                  </span>
                  <span className="font-mono">
                    {formatCurrency(results.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Loyer annuel</span>
                  <span className="font-mono">
                    {formatCurrency(results.annualRent)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
