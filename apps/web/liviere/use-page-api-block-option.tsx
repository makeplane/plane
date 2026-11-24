/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: page menu item "Block API changes". When on, the public API refuses every change
// to the page (content, title, archive, delete); reading still works. Owner or project admin only.

import { useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { ToggleSwitch } from "@plane/ui";
import type { TContextMenuItem } from "@plane/ui";
import type { TPageActions } from "@/components/pages/dropdowns/actions";
import type { TPageInstance } from "@/store/pages/base-page";
import type { TExtendedPageInstance } from "@/store/pages/extended-base-page";
import { PageApiBlockService } from "./page-api-block.service";

const pageApiBlockService = new PageApiBlockService();

export const PAGE_API_BLOCK_OPTION_KEY: TPageActions = "liviere-api-block";

export const usePageApiBlockOption = (page: TPageInstance) => {
  const { workspaceSlug, projectId } = useParams();
  // Page instances extend ExtendedBasePage, which TPageInstance does not spell out
  const { id, isApiChangesBlocked, canCurrentUserLockPage, setApiChangesBlocked } = page as TPageInstance &
    TExtendedPageInstance;

  const toggle = useCallback(async () => {
    if (!workspaceSlug || !projectId || !id) return;
    const blocked = !isApiChangesBlocked;
    setApiChangesBlocked(blocked);
    try {
      await pageApiBlockService.setBlocked(workspaceSlug.toString(), projectId.toString(), id, blocked);
    } catch {
      setApiChangesBlocked(!blocked);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "The setting could not be saved. Please try again later.",
      });
    }
  }, [workspaceSlug, projectId, id, isApiChangesBlocked, setApiChangesBlocked]);

  return useMemo(
    (): TContextMenuItem & { key: TPageActions } => ({
      key: PAGE_API_BLOCK_OPTION_KEY,
      action: () => void toggle(),
      customContent: (
        <>
          Block API changes
          <ToggleSwitch value={isApiChangesBlocked} onChange={() => {}} />
        </>
      ),
      className: "flex items-center justify-between gap-2",
      // Project pages only; same rule as locking a page
      shouldRender: Boolean(projectId) && canCurrentUserLockPage,
    }),
    [toggle, isApiChangesBlocked, projectId, canCurrentUserLockPage]
  );
};
