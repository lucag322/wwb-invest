"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandGroupHeading,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Building2,
  CheckSquare,
  Users,
  Calculator,
  LayoutDashboard,
  Scale,
  FolderOpen,
  ListTodo,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SearchResults {
  deals: Array<{
    id: string;
    name: string;
    city: string;
    price: number;
    status: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    category: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    type: string;
    city: string | null;
  }>;
}

const QUICK_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tâches", icon: ListTodo },
  { href: "/deals", label: "Deals", icon: Building2 },
  { href: "/calculator", label: "Calculateur", icon: Calculator },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/sci", label: "SCI & Juridique", icon: Scale },
  { href: "/documents", label: "Documents", icon: FolderOpen },
];

const STATUS_LABELS: Record<string, string> = {
  a_analyser: "À analyser",
  interessant: "Intéressant",
  visite_prevue: "Visite prévue",
  visite: "Visité",
  offre_faite: "Offre faite",
  refuse: "Refusé",
  achete: "Acheté",
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminé",
};

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  }

  function navigate(href: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(href);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery("");
      setResults(null);
    }
  }

  const hasResults =
    results &&
    (results.deals.length > 0 ||
      results.tasks.length > 0 ||
      results.contacts.length > 0);

  const showQuickLinks = !query || query.trim().length < 2;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-100"
        onClick={() => handleOpenChange(false)}
      />
      <div className="fixed top-[20%] left-1/2 z-50 w-full max-w-lg -translate-x-1/2 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-150">
        <Command
          className="rounded-xl border border-border shadow-2xl"
          shouldFilter={false}
        >
          <CommandInput
            placeholder="Rechercher deals, tâches, contacts..."
            value={query}
            onValueChange={handleQueryChange}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleOpenChange(false);
            }}
            autoFocus
          />
          <CommandList>
            {loading && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Recherche...
              </div>
            )}

            {!loading && query.trim().length >= 2 && !hasResults && (
              <CommandEmpty>Aucun résultat pour "{query}"</CommandEmpty>
            )}

            {showQuickLinks && (
              <CommandGroup>
                <CommandGroupHeading>Navigation rapide</CommandGroupHeading>
                {QUICK_LINKS.map((link) => (
                  <CommandItem
                    key={link.href}
                    value={link.label}
                    onSelect={() => navigate(link.href)}
                  >
                    <link.icon className="h-4 w-4 text-muted-foreground" />
                    <span>{link.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {hasResults && (
              <>
                {results.deals.length > 0 && (
                  <CommandGroup>
                    <CommandGroupHeading>Deals</CommandGroupHeading>
                    {results.deals.map((deal) => (
                      <CommandItem
                        key={deal.id}
                        value={`deal-${deal.id}`}
                        onSelect={() => navigate(`/deals/${deal.id}`)}
                      >
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {deal.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {deal.city} · {formatCurrency(deal.price)}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {STATUS_LABELS[deal.status] || deal.status}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.deals.length > 0 &&
                  (results.tasks.length > 0 || results.contacts.length > 0) && (
                    <CommandSeparator />
                  )}

                {results.tasks.length > 0 && (
                  <CommandGroup>
                    <CommandGroupHeading>Tâches</CommandGroupHeading>
                    {results.tasks.map((task) => (
                      <CommandItem
                        key={task.id}
                        value={`task-${task.id}`}
                        onSelect={() => navigate("/tasks")}
                      >
                        <CheckSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {task.category} ·{" "}
                            {STATUS_LABELS[task.status] || task.status}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {results.tasks.length > 0 && results.contacts.length > 0 && (
                  <CommandSeparator />
                )}

                {results.contacts.length > 0 && (
                  <CommandGroup>
                    <CommandGroupHeading>Contacts</CommandGroupHeading>
                    {results.contacts.map((contact) => (
                      <CommandItem
                        key={contact.id}
                        value={`contact-${contact.id}`}
                        onSelect={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {contact.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.type}
                            {contact.city ? ` · ${contact.city}` : ""}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>

          <div className="border-t border-border px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">↑↓</kbd>{" "}
                naviguer
              </span>
              <span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">↵</kbd>{" "}
                ouvrir
              </span>
              <span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">esc</kbd>{" "}
                fermer
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}
