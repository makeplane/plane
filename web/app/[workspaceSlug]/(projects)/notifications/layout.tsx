"use client";

// components
import { NotificationsSidebar } from "@/components/workspace-notifications";

export default function ProjectInboxIssuesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full h-full overflow-hidden flex items-center">
      <div className="relative w-full lg:w-2/6 border-0 lg:border-r border-custom-border-200 z-[10] flex-shrink-0 bg-custom-background-100 h-full transition-all overflow-hidden">
        <NotificationsSidebar />
      </div>
      <div className="w-full h-full overflow-hidden overflow-y-auto">{children}</div>
    </div>
  );
}
