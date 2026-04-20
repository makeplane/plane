/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { FolderOutput } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { IconButton } from "@plane/propel/icon-button";
// core imports
import type { TPageMoveControlProps } from "@/ce/components/pages/header/move-control";
import { EPageStoreType, useCollection, useFlag, usePageStore, useWorkspaceFeatures } from "@/plane-web/hooks/store";
// plane web hooks
import { usePageFlag } from "@/plane-web/hooks/use-page-flag";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import { MovePageModal } from "../modals/move";

export const PageMoveControl = observer(function PageMoveControl(props: TPageMoveControlProps) {
  const { page } = props;
  // states
  const [isMovePageModalOpen, setIsMovePageModalOpen] = useState(false);
  // navigation
  const { workspaceSlug, teamspaceId, projectId } = useParams();
  // derived values
  const { canCurrentUserMovePage } = page;
  // page flag
  const { isMovePageEnabled } = usePageFlag({
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });
  const collectionStore = useCollection();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  const { getCanCreatePage } = usePageStore(EPageStoreType.WORKSPACE);
  const isWikiEnabled = useFlag(workspaceSlug?.toString() ?? "", "WORKSPACE_PAGES");
  const isTeamspacesEnabled = isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_TEAMSPACES_ENABLED);
  const canCreateWikiPage = workspaceSlug ? getCanCreatePage(workspaceSlug) : false;
  const canPageBeMovedToWiki =
    !!workspaceSlug &&
    !!(projectId || teamspaceId) &&
    isWikiEnabled &&
    canCreateWikiPage &&
    (!teamspaceId || isTeamspacesEnabled);

  const handleOpenMoveModal = useCallback(() => {
    if (canPageBeMovedToWiki && workspaceSlug && !collectionStore.workspaceCollections) {
      void collectionStore.fetchCollections(workspaceSlug.toString());
    }

    setIsMovePageModalOpen(true);
  }, [canPageBeMovedToWiki, collectionStore, workspaceSlug]);

  if (!isMovePageEnabled || !canCurrentUserMovePage) return null;

  return (
    <>
      <MovePageModal isOpen={isMovePageModalOpen} onClose={() => setIsMovePageModalOpen(false)} page={page} />
      <Tooltip tooltipContent="Move page" position="bottom">
        <IconButton
          variant="ghost"
          size="lg"
          icon={FolderOutput}
          onClick={handleOpenMoveModal}
          aria-label="Move page"
        />
      </Tooltip>
    </>
  );
});
