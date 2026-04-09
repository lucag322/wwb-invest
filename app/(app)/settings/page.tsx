"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Download, Upload, User, Database } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    try {
      const res = await fetch("/api/export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wwb-invest-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Données exportées avec succès");
    } catch {
      toast.error("Erreur lors de l'export");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("Données importées avec succès");
      } else {
        toast.error("Erreur lors de l'import");
      }
    } catch {
      toast.error("Fichier JSON invalide");
    }
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <PageContainer>
      <PageHeader
        title="Paramètres"
        description="Configuration et gestion des données"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Compte
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Nom</span>
            <span className="text-sm font-medium">
              {session?.user?.name || "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm font-medium">
              {session?.user?.email || "—"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" />
            Données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-1">Exporter les données</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Téléchargez toutes vos données au format JSON
            </p>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" /> Exporter en JSON
            </Button>
          </div>
          <Separator />
          <div>
            <h4 className="text-sm font-medium mb-1">Importer des données</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Importez des données depuis un fichier JSON exporté précédemment.
              Les données existantes ne seront pas écrasées.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? "Import en cours..." : "Importer un fichier JSON"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">À propos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">WWB Investissement SCI</strong>{" "}
            — Plateforme de gestion d&apos;investissement immobilier
          </p>
          <p>Version 1.0.0</p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
