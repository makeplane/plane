/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: "New" item of the workspace sidebar with the number of new work items. Rendered by
// components/workspace/sidebar/sidebar-menu-items.tsx; markup of SidebarItemBase (./sidebar-item.tsx there).

import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { ListItem, ListItemLabel } from "@makeplane/propel/components/list";
import { ListItemLink } from "@makeplane/propel/elements/list";
import { MailOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { getNumberCount, joinUrlPath } from "@plane/utils";
import { CountChip } from "@/components/common/count-chip";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useNewWorkItemsCount } from "./use-new-work-items";

export const NEW_WORK_ITEMS_PATH = "new-work-items";

export const LiviereNewWorkItemsSidebarItem = observer(function LiviereNewWorkItemsSidebarItem() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  const slug = workspaceSlug?.toString() || "";
  const { toggleSidebar, isExtendedSidebarOpened, toggleExtendedSidebar } = useAppTheme();
  const { data: counts } = useNewWorkItemsCount(slug || undefined);

  if (!slug) return null;
  const href = joinUrlPath(slug, NEW_WORK_ITEMS_PATH);
  const total = counts?.total ?? 0;

  const handleLinkClick = () => {
    if (window.innerWidth < 768) toggleSidebar();
    if (isExtendedSidebarOpened) toggleExtendedSidebar(false);
  };

  return (
    <ListItem density="comfortable">
      <ListItemLink
        href={href}
        render={<Link href={href} />}
        onClick={handleLinkClick}
        aria-current={pathname.includes(`/${NEW_WORK_ITEMS_PATH}`) ? "page" : undefined}
      >
        <MailOutline className="size-4 flex-shrink-0" />
        <ListItemLabel>{t("liviere.unread.title")}</ListItemLabel>
        {total > 0 && <CountChip count={getNumberCount(total)} className="ml-auto" />}
      </ListItemLink>
    </ListItem>
  );
});
