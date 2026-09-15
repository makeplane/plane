/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// plane imports
import { RESEARCH_PROJECT_NAVIGATION_ITEMS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useResearch } from "@/hooks/store/use-research";

type Props = {
  workspaceSlug: string;
  projectId: string;
};

/**
 * Project scoped research navigation (P1-UI-01). Entries whose sub switch is
 * off simply do not render; nothing existing is moved or removed (P1-UI-08).
 */
export const ResearchProjectNav = observer(function ResearchProjectNav({ workspaceSlug, projectId }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const research = useResearch();
  const sections = research.identity?.sections;

  const items = RESEARCH_PROJECT_NAVIGATION_ITEMS.filter((item) => Boolean(sections?.[item.section]));
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-subtle px-5 py-2">
      {items.map((item) => {
        const href = `/${workspaceSlug}/research/projects/${projectId}/${item.path}`;
        const isActive = Boolean(pathname?.startsWith(href));
        return (
          <Link
            key={item.key}
            href={href}
            className={`rounded-md px-2 py-1 text-12 transition-colors ${
              isActive ? "bg-surface-2 text-primary" : "text-secondary hover:bg-surface-2"
            }`}
          >
            {t(item.labelKey)}
          </Link>
        );
      })}
    </div>
  );
});
