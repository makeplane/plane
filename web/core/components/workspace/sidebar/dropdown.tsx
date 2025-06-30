"use client";

import { observer } from "mobx-react";
import { UserMenuRoot } from "./user-menu-root";
import { WorkspaceMenuRoot } from "./workspace-menu-root";

export const SidebarDropdown = observer(() => (
  <div className="flex items-center justify-center gap-x-3 gap-y-2">
    <WorkspaceMenuRoot />
    <UserMenuRoot />
  </div>
));
