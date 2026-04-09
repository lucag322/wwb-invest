"use client";

import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { CommandSearch } from "@/components/shared/command-search";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="md:pl-64">
        <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">{children}</div>
      </main>
      <MobileNav />
      <CommandSearch />
    </div>
  );
}
