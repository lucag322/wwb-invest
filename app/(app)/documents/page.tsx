"use client";

import { useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PageHeader } from "@/components/layout/header";
import { PageContainer } from "@/components/shared/page-container";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  FolderOpen,
  FileText,
  Upload,
  FolderPlus,
  Trash2,
  Pencil,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  Home,
  FileImage,
  FileSpreadsheet,
  File,
  HardDrive,
  Loader2,
  Unplug,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
}

interface Breadcrumb {
  id: string;
  name: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType === "application/vnd.google-apps.folder") return FolderOpen;
  if (mimeType.startsWith("image/")) return FileImage;
  if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return FileSpreadsheet;
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  )
    return FileText;
  return File;
}

function formatFileSize(bytes?: string) {
  if (!bytes) return "";
  const size = parseInt(bytes);
  if (size < 1024) return `${size} o`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} Ko`;
  if (size < 1024 * 1024 * 1024)
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

export default function DocumentsPage() {
  const { data: statusData, mutate: mutateStatus } = useSWR<{ connected: boolean; rootFolderId?: string }>(
    "/api/google/status",
    fetcher
  );
  const connected = statusData?.connected ?? null;
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [uploading, setUploading] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState<DriveFile | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DriveFile | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (connected && !initialLoad) {
    setInitialLoad(true);
    loadFiles();
  }

  async function loadFiles(folderId?: string) {
    setLoading(true);
    try {
      const params = folderId ? `?folderId=${folderId}` : "";
      const res = await fetch(`/api/documents${params}`);
      const data = await res.json();
      if (data.error === "not_connected") {
        mutateStatus({ connected: false }, { revalidate: false });
        return;
      }
      setFiles(data.files || []);
      setCurrentFolderId(data.currentFolderId);
      setRootFolderId(data.rootFolderId);
      setBreadcrumbs(data.breadcrumbs || []);
    } catch {
      toast.error("Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  async function connectDrive() {
    const res = await fetch("/api/google/auth");
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  async function disconnectDrive() {
    await fetch("/api/google/status", { method: "DELETE" });
    mutateStatus({ connected: false }, { revalidate: false });
    setFiles([]);
    toast.success("Google Drive déconnecté");
  }

  function navigateToFolder(folderId: string) {
    loadFiles(folderId);
  }

  function navigateToRoot() {
    if (rootFolderId) loadFiles(rootFolderId);
    else loadFiles();
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    setUploading(true);
    let successCount = 0;

    for (const file of Array.from(fileList)) {
      try {
        const formData = new FormData();
        formData.append("action", "upload");
        formData.append("file", file);
        if (currentFolderId) formData.append("parentId", currentFolderId);

        const res = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });
        if (res.ok) successCount++;
      } catch {
        toast.error(`Erreur: ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} fichier${successCount > 1 ? "s" : ""} uploadé${successCount > 1 ? "s" : ""}`
      );
      loadFiles(currentFolderId || undefined);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim() || creatingFolder) return;
    setCreatingFolder(true);
    try {
      const formData = new FormData();
      formData.append("action", "createFolder");
      formData.append("name", newFolderName.trim());
      if (currentFolderId) formData.append("parentId", currentFolderId);

      const res = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        toast.success("Dossier créé");
        setNewFolderOpen(false);
        setNewFolderName("");
        loadFiles(currentFolderId || undefined);
      }
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleRename() {
    if (!renameTarget || !renameName.trim()) return;
    const res = await fetch("/api/documents/rename", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: renameTarget.id, name: renameName.trim() }),
    });
    if (res.ok) {
      toast.success("Renommé");
      setRenameTarget(null);
      loadFiles(currentFolderId || undefined);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const res = await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileId: deleteTarget.id }),
    });
    if (res.ok) {
      toast.success("Supprimé");
      setDeleteTarget(null);
      loadFiles(currentFolderId || undefined);
    }
  }

  function handleFileClick(file: DriveFile) {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      navigateToFolder(file.id);
    } else if (file.webViewLink) {
      window.open(file.webViewLink, "_blank");
    }
  }

  if (connected === null) {
    return (
      <PageContainer>
        <PageHeader title="Documents" />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    );
  }

  if (!connected) {
    return (
      <PageContainer>
        <PageHeader
          title="Documents"
          description="Gérez vos documents immobiliers"
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <HardDrive className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                Connecter Google Drive
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Connectez votre compte Google pour stocker et organiser tous vos
                documents immobiliers (compromis, diagnostics, plans, devis...)
                directement depuis l&apos;application.
              </p>
            </div>
            <Button onClick={connectDrive} size="lg" className="mt-2">
              <HardDrive className="h-4 w-4 mr-2" /> Connecter Google Drive
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  const folders = files.filter(
    (f) => f.mimeType === "application/vnd.google-apps.folder"
  );
  const documents = files.filter(
    (f) => f.mimeType !== "application/vnd.google-apps.folder"
  );

  return (
    <PageContainer>
      <PageHeader
        title="Documents"
        description="Vos documents sur Google Drive"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewFolderOpen(true)}
            >
              <FolderPlus className="h-4 w-4 mr-1" /> Dossier
            </Button>
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-1" />
              )}
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </div>
        }
      />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <button
          onClick={navigateToRoot}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-accent/50"
        >
          <Home className="h-3.5 w-3.5" />
          <span>WWB Investissement</span>
        </button>
        {breadcrumbs.map((crumb) => (
          <div key={crumb.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <button
              onClick={() => navigateToFolder(crumb.id)}
              className="text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 rounded hover:bg-accent/50"
            >
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderOpen className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Ce dossier est vide
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNewFolderOpen(true)}
              >
                <FolderPlus className="h-4 w-4 mr-1" /> Nouveau dossier
              </Button>
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" /> Uploader un fichier
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {folders.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Dossiers
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {folders.map((folder) => (
                  <Card
                    key={folder.id}
                    className="cursor-pointer hover:bg-accent/30 transition-colors group"
                    onClick={() => handleFileClick(folder)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <FolderOpen className="h-8 w-8 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate flex-1">
                        {folder.name}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded h-7 w-7 hover:bg-muted shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameTarget(folder);
                              setRenameName(folder.name);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Renommer
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(folder);
                            }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {documents.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Fichiers
              </p>
              <Card>
                <div className="divide-y divide-border">
                  {documents.map((file) => {
                    const Icon = getFileIcon(file.mimeType);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer group"
                        onClick={() => handleFileClick(file)}
                      >
                        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {file.size && (
                              <span>{formatFileSize(file.size)}</span>
                            )}
                            {file.modifiedTime && (
                              <span>{formatDate(file.modifiedTime)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded h-7 w-7 hover:bg-muted"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center rounded h-7 w-7 hover:bg-muted"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameTarget(file);
                                  setRenameName(file.name);
                                }}
                              >
                                <Pencil className="h-4 w-4 mr-2" /> Renommer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(file);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Disconnect option */}
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground text-xs"
          onClick={disconnectDrive}
        >
          <Unplug className="h-3.5 w-3.5 mr-1" /> Déconnecter Google Drive
        </Button>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau dossier</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nom du dossier"
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setNewFolderOpen(false)}
                disabled={creatingFolder}
              >
                Annuler
              </Button>
              <Button onClick={handleCreateFolder} disabled={creatingFolder}>
                {creatingFolder && (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                )}
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRenameTarget(null)}
              >
                Annuler
              </Button>
              <Button onClick={handleRename}>Renommer</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Supprimer "${deleteTarget?.name}" ?`}
        description="Le fichier sera supprimé de Google Drive. Cette action est irréversible."
        onConfirm={handleDelete}
        confirmLabel="Supprimer"
        destructive
      />
    </PageContainer>
  );
}
