/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { RESEARCH_NAVIGATION_ITEMS, RESEARCH_SETTINGS_NAVIGATION_ITEMS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// hooks
import { useResearch } from "@/hooks/store/use-research";

/**
 * Research navigation block.
 *
 * Purely additive: existing sidebar entries keep their order and behaviour
 * (P0-UI-01, P0-UI-08). When the workspace switch is off or the caller has no
 * research role the block renders nothing (P0-UI-06, P0-UI-07).
 */
export const ResearchSidebarItems = observer(function ResearchSidebarItems() {
  const { t } = useTranslation();
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  const research = useResearch();

  useEffect(() => {
    if (workspaceSlug && !research.identity) {
      void research.fetchIdentity(workspaceSlug).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  if (!workspaceSlug || !research.isEnabled) return null;

  const sections = research.identity?.sections;
  const visibleBusinessItems = RESEARCH_NAVIGATION_ITEMS.filter((item) => Boolean(sections?.[item.section]));
  const visibleSettingsItems = research.isWorkspaceAdmin
    ? RESEARCH_SETTINGS_NAVIGATION_ITEMS.filter((item) => (item.section === "org" ? sections?.org : sections?.reports))
    : [];

  const renderItem = (key: string, labelKey: string, path: string) => {
    const href = `/${workspaceSlug}/research/${path}`;
    const isActive = pathname?.startsWith(href);
    return (
      <Link
        key={key}
        href={href}
        className={`flex items-center rounded-md px-2 py-1.5 text-13 transition-colors ${
          isActive ? "bg-surface-2 text-primary" : "text-secondary hover:bg-surface-2"
        }`}
      >
        {t(labelKey)}
      </Link>
    );
  };

  return (
    <div className="mt-3 border-t border-subtle pt-3">
      <p className="px-2 pb-1 text-11 tracking-wide text-tertiary uppercase">{t("research.nav.group")}</p>
      <div className="flex flex-col gap-0.5">
        {renderItem("overview", "research.nav.overview", "")}
        {visibleBusinessItems.map((item) => renderItem(item.key, item.labelKey, item.path))}
        {visibleSettingsItems.map((item) => renderItem(item.key, item.labelKey, item.path))}
      </div>
    </div>
  );
});
