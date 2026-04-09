import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="space-y-6 max-w-7xl mx-auto">{children}</div>;
}
