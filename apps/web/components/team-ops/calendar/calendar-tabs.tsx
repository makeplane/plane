/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@plane/utils";
// hooks
import { useCalendarSettings } from "@/hooks/team-ops/use-work-calendar";

type Props = {
  workspaceSlug: string;
};

/** The pages of the work calendar, in the order they are offered. Pages the user may not open are left out. */
const getTabs = (workspaceSlug: string, canViewTeam: boolean) => {
  const base = `/${workspaceSlug}/team-ops/calendar`;
  return [
    { key: "my", label: "My calendar", href: base },
    ...(canViewTeam ? [{ key: "team", label: "Team calendar", href: `${base}/team` }] : []),
    { key: "reports", label: "Reports", href: `${base}/reports` },
    { key: "settings", label: "Settings", href: `${base}/settings` },
  ];
};

export const CalendarTabs = observer(function CalendarTabs({ workspaceSlug }: Props) {
  const pathname = usePathname().replace(/\/$/, "");
  const { permissions } = useCalendarSettings(workspaceSlug);

  return (
    <nav aria-label="Work calendar" className="flex gap-1 border-b border-subtle px-6">
      {getTabs(workspaceSlug, permissions?.can_view_team ?? false).map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.key}
            href={`${tab.href}/`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-body-sm-medium transition-colors",
              isActive ? "border-accent-strong text-primary" : "border-transparent text-tertiary hover:text-secondary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
});
