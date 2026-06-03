/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet, useParams, useLocation, useNavigate } from "react-router";
import { User, BarChart2, Users, Download } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { EUserPermissionsLevel } from "@plane/constants";
import { EUserWorkspaceRoles } from "@plane/types";
import { Header, EHeaderVariant } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
// hooks
import { useUserPermissions } from "@/hooks/store/user/user-permissions";
// local
import { WorkspaceTimeTrackingHeader } from "./header";

const ALL_TAB_ITEMS = [
  { key: "my_timesheet", labelKey: "my_timesheet", path: "", icon: User, adminOnly: false },
  { key: "analytics", labelKey: "project_analytics", path: "analytics", icon: BarChart2, adminOnly: true },
  { key: "capacity", labelKey: "capacity", path: "capacity", icon: Users, adminOnly: true },
  { key: "exports", labelKey: "capacity_exports.tab", path: "exports", icon: Download, adminOnly: false },
] as const;

export default function WorkspaceTimeTrackingLayout() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { allowPermissions } = useUserPermissions();

  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);
  const TAB_ITEMS = ALL_TAB_ITEMS.filter((tab) => !tab.adminOnly || isAdmin);

  const basePath = `/${workspaceSlug}/time-tracking`;
  const activeTab = (() => {
    const pathname = location.pathname.replace(/\/$/, "");
    if (pathname.endsWith("/analytics")) return "analytics";
    if (pathname.endsWith("/capacity")) return "capacity";
    if (pathname.endsWith("/exports")) return "exports";
    return "my_timesheet";
  })();

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Top Breadcrumbs Header */}
      <AppHeader header={<WorkspaceTimeTrackingHeader />} />

      {/* Sub-tabs Header - Fixed at top */}
      <Header variant={EHeaderVariant.SECONDARY} className="border-t border-subtle">
        <div className="flex h-full items-center px-3">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <div
                key={tab.key}
                role="button"
                tabIndex={0}
                className={cn(
                  "relative flex h-full cursor-pointer items-center gap-2 px-4 text-13 font-semibold transition-all",
                  isActive ? "text-accent-primary" : "text-secondary hover:text-primary"
                )}
                onClick={() => {
                  if (!isActive) void navigate(`${basePath}${tab.path ? `/${tab.path}` : ""}`);
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !isActive) {
                    void navigate(`${basePath}${tab.path ? `/${tab.path}` : ""}`);
                  }
                }}
              >
                <Icon size={14} className={isActive ? "text-accent-primary" : "text-tertiary"} />
                <span>{t(tab.labelKey)}</span>
                {isActive && <div className="border-accent-primary absolute right-0 bottom-0 left-0 border-b-2" />}
              </div>
            );
          })}
        </div>
      </Header>

      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-hidden bg-surface-1">
        <ContentWrapper className="h-full !p-0">
          <Outlet />
        </ContentWrapper>
      </div>
      <IssuePeekOverview />
    </div>
  );
}
