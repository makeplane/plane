"use client";

// components
import { NotificationsSidebarRoot } from "@/components/workspace-notifications";

export default function ProjectInboxIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full overflow-hidden flex items-center">
      <NotificationsSidebarRoot />
      <div className="w-full h-full overflow-hidden overflow-y-auto">{children}</div>
    </div>
  );
}
