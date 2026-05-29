import { Outlet } from "react-router";
// components
import { NotificationsSidebarRoot } from "@/components/workspace-notifications/sidebar";

export default function ProjectInboxIssuesLayout() {
  return (
    <div className="relative flex h-full w-full items-center overflow-hidden">
      <NotificationsSidebarRoot />
      <div className="h-full w-full overflow-hidden overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
