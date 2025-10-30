import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Management - God Mode",
};

export default function WorkspaceManagementLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
