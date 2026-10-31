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

export const ReportsTabs = observer(function ReportsTabs({ workspaceSlug }: { workspaceSlug: string }) {
  const pathname = usePathname().replace(/\/$/, "");
  const { permissions } = useCalendarSettings(workspaceSlug);
  const base = `/${workspaceSlug}/team-ops/reports`;
  const tabs = [
    { key: "mine", label: "My reports", href: base },
    ...(permissions?.can_view_team ? [{ key: "board", label: "Team board", href: `${base}/board` }] : []),
  ];

  return (
    <nav aria-label="Work reports" className="flex gap-1 border-b border-subtle px-6">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`${tab.href}/`}
          aria-current={pathname === tab.href ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-body-sm-medium transition-colors",
            pathname === tab.href
              ? "border-accent-strong text-primary"
              : "border-transparent text-tertiary hover:text-secondary"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
});
