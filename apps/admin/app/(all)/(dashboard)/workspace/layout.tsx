import { ReactNode } from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Management - God Mode",
};

export default function WorkspaceManagementLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
