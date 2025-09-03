import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace Management - God Mode",
};

export default function WorkspaceManagementLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
