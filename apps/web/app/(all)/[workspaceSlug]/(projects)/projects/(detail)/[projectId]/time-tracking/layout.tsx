/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet, useParams, useLocation, useNavigate } from "react-router";
import { User, BarChart2, Users } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Header, EHeaderVariant } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
// local
import { TimeTrackingHeader } from "./header";

const TAB_ITEMS = [
  { key: "timesheet", labelKey: "my_timesheet", path: "", icon: User },
  { key: "analytics", labelKey: "project_analytics", path: "analytics", icon: BarChart2 },
  { key: "capacity", labelKey: "capacity", path: "capacity", icon: Users },
] as const;

export default function TimeTrackingLayout() {
  const { t } = useTranslation();
  const { workspaceSlug, projectId } = useParams<{ workspaceSlug: string; projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const basePath = `/${workspaceSlug}/projects/${projectId}/time-tracking`;
  const activeTab = (() => {
    const pathname = location.pathname.replace(/\/$/, "");
    if (pathname.endsWith("/analytics")) return "analytics";
    if (pathname.endsWith("/capacity")) return "capacity";
    return "timesheet";
  })();

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Top Breadcrumbs Header */}
      <AppHeader header={<TimeTrackingHeader />} />

      {/* Sub-tabs Header - Fixed at top, matches Intake exactly */}
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
                  "text-13 relative flex items-center gap-2 h-full px-4 cursor-pointer transition-all font-semibold",
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
                {isActive && <div className="absolute bottom-0 left-0 right-0 border-b-2 border-accent-primary" />}
              </div>
            );
          })}
        </div>
      </Header>

      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-hidden bg-surface-1">
        <ContentWrapper className="!p-0 h-full">
          <Outlet />
        </ContentWrapper>
      </div>
    </div>
  );
}
