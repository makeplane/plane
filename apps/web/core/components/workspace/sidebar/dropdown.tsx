// hooks
import { UserMenuRoot } from "./user-menu-root";
import { WorkspaceMenuRoot } from "./workspace-menu-root";

export const SidebarDropdown = () => (
  <div className="flex items-center justify-center gap-1.5 w-full">
    <WorkspaceMenuRoot />
    <UserMenuRoot />
  </div>
);
