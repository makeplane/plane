/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
// plane internal packages
import { TooltipProvider } from "@makeplane/propel/components/tooltip";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// hooks
import { useTheme } from "@/hooks/store";
// components
import { AdminSidebarDropdown } from "./sidebar-dropdown";
import { AdminSidebarHelpSection } from "./sidebar-help-section";
import { AdminSidebarMenu } from "./sidebar-menu";

// Below the `md` breakpoint the sidebar overlays the page instead of sitting beside it.
const isMobileViewport = () => window.innerWidth < 768;

export const AdminSidebar = observer(function AdminSidebar() {
  // plane hooks
  const { t } = useTranslation();
  // store
  const { isSidebarCollapsed, toggleSidebar } = useTheme();

  // collapse the overlay sidebar whenever the viewport is mobile-sized
  useEffect(() => {
    const handleResize = () => {
      if (isMobileViewport()) toggleSidebar(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [toggleSidebar]);

  // Escape closes the overlay sidebar, unless an open menu or dialog should handle it first
  useEffect(() => {
    if (isSidebarCollapsed) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented || !isMobileViewport()) return;
      if (document.querySelector('[role="menu"], [role="dialog"]')) return;
      toggleSidebar(true);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSidebarCollapsed, toggleSidebar]);

  return (
    <>
      {!isSidebarCollapsed && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={t("aria_labels.projects_sidebar.collapse_sidebar")}
          className="fixed inset-0 z-20 bg-backdrop md:hidden"
          onClick={() => toggleSidebar(true)}
        />
      )}
      <aside
        id="admin-sidebar"
        aria-label="Instance admin"
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex h-full w-72 shrink-0 flex-col border-r border-subtle bg-surface-1 transition-[width,transform] duration-300 motion-reduce:transition-none md:relative md:translate-x-0",
          {
            "-translate-x-full max-md:invisible md:w-17.5": isSidebarCollapsed,
            "translate-x-0": !isSidebarCollapsed,
          }
        )}
      >
        <TooltipProvider>
          <div className="flex h-full min-h-0 w-full flex-col">
            <AdminSidebarDropdown />
            <AdminSidebarMenu />
            <AdminSidebarHelpSection />
          </div>
        </TooltipProvider>
      </aside>
    </>
  );
});
