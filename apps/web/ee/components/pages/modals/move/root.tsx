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

import React, { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Combobox } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EPageAccess } from "@plane/types";
import type { TMovePageActions, TMovePageEntity } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// ce imports
import type { TMovePageModalProps } from "@/ce/components/pages";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { EPageStoreType, useCollection, useFlag, usePageStore, useWorkspaceFeatures } from "@/plane-web/hooks/store";
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local imports
import { MovePageModalBody } from "./body";
import { MovePageModalFooter } from "./footer";
import { MovePageModalInput } from "./input";
import { getLoadedSubtreePageIds } from "@/plane-web/store/pages/page-tree";

export type TMovePageSelectedValue = `project-${string}` | `teamspace-${string}` | "workspace" | `workspace-${string}`;

export const MovePageModal = observer(function MovePageModal(props: TMovePageModalProps) {
  const { isOpen, onClose, page } = props;
  // states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedValue, setSelectedValue] = useState<TMovePageSelectedValue | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  // refs
  const moveButtonRef = useRef<HTMLButtonElement>(null);
  // navigation
  const { workspaceSlug, teamspaceId, projectId } = useParams();
  const router = useAppRouter();
  // translation
  const { t } = useTranslation();
  // store hooks
  const { movePage } = usePageStore(EPageStoreType.PROJECT);
  const { getOrFetchPageInstance, getPageById, removePageInstance, getCanCreatePage } = usePageStore(
    EPageStoreType.WORKSPACE
  );
  const collectionStore = useCollection();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // derived values
  const { access, id, is_shared, archived_at } = page;
  const canPageBeMovedToTeamspace = access === EPageAccess.PUBLIC && !is_shared && !archived_at;
  const isWikiEnabled = useFlag(workspaceSlug?.toString() ?? "", "WORKSPACE_PAGES");
  const isTeamspacesEnabled = isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_TEAMSPACES_ENABLED);
  const canCreateWikiPage = workspaceSlug ? getCanCreatePage(workspaceSlug) : false;
  const canPageBeMovedToWiki =
    !!workspaceSlug &&
    !!(projectId || teamspaceId) &&
    isWikiEnabled &&
    canCreateWikiPage &&
    (!teamspaceId || isTeamspacesEnabled);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      setSearchTerm("");
      setSelectedValue(null);
    }, 300);
  }, [onClose]);

  const handleMovePage = useCallback(async () => {
    if (!selectedValue || !id) return;

    const moveSource: TMovePageEntity = teamspaceId ? "teamspace" : projectId ? "project" : "workspace";
    let moveTarget: TMovePageEntity | null = null;
    if (selectedValue.startsWith("teamspace-")) {
      moveTarget = "teamspace";
    } else if (selectedValue.startsWith("project-")) {
      moveTarget = "project";
    } else if (selectedValue === "workspace" || selectedValue.startsWith("workspace-")) {
      moveTarget = "workspace";
    }
    if (!moveTarget) return;

    const moveSourceIdentifier = teamspaceId ?? projectId ?? workspaceSlug;
    const targetCollectionId =
      selectedValue !== "workspace" && selectedValue.startsWith("workspace-")
        ? selectedValue.replace("workspace-", "")
        : null;
    const moveTargetIdentifier =
      moveTarget === "workspace"
        ? workspaceSlug?.toString()
        : moveTarget === "project"
          ? selectedValue.replace("project-", "")
          : selectedValue.replace("teamspace-", "");
    if (!moveSourceIdentifier || !moveTargetIdentifier) return;

    const redirectPath =
      moveTarget === "workspace"
        ? `/${workspaceSlug?.toString()}/wiki/${id}`
        : moveTarget === "project"
          ? `/${workspaceSlug?.toString()}/projects/${moveTargetIdentifier}/pages/${id}`
          : `/${workspaceSlug?.toString()}/teamspaces/${moveTargetIdentifier}/pages/${id}`;
    let didFailCollectionAssignment = false;

    try {
      await movePage({
        pageId: id,
        data: {
          move_type: `${moveSource}_to_${moveTarget}` as TMovePageActions,
          source_identifier: moveSourceIdentifier?.toString(),
          target_identifier: moveTargetIdentifier,
        },
      });

      if (moveTarget === "workspace" && workspaceSlug) {
        try {
          await getOrFetchPageInstance({
            pageId: id,
            trackVisit: false,
            refreshIfExists: true,
          });

          const resolvedTargetCollectionId = targetCollectionId ?? collectionStore.defaultCollectionId;
          if (resolvedTargetCollectionId) {
            await collectionStore.addPageToCollection(workspaceSlug.toString(), id, resolvedTargetCollectionId);
            collectionStore.setCollectionExpanded(resolvedTargetCollectionId);
          }
        } catch (error) {
          console.error("Unable to move page to selected wiki collection", error);
          didFailCollectionAssignment = true;
        }
      }

      if (moveSource === "workspace" && moveTarget !== "workspace") {
        const loadedSubtreePageIds = getLoadedSubtreePageIds(id, getPageById);
        collectionStore.removeExplicitPageCollectionsFromStore(loadedSubtreePageIds);
        loadedSubtreePageIds.forEach((pageId) => removePageInstance(pageId));
      }

      if (workspaceSlug) {
        router.replace(redirectPath);
      }

      if (didFailCollectionAssignment) {
        setToast({
          type: TOAST_TYPE.WARNING,
          title: t("page_actions.move_page.toasts.collection_error.title"),
          message: t("page_actions.move_page.toasts.collection_error.message"),
        });
      } else {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("page_actions.move_page.toasts.success.title"),
          message: t("page_actions.move_page.toasts.success.message"),
        });
      }
      handleClose();
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("page_actions.move_page.toasts.error.title"),
        message: t("page_actions.move_page.toasts.error.message"),
      });
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [
    collectionStore,
    getOrFetchPageInstance,
    getPageById,
    handleClose,
    id,
    movePage,
    projectId,
    removePageInstance,
    router,
    selectedValue,
    teamspaceId,
    workspaceSlug,
  ]);

  const handleMove = useCallback(async () => {
    setIsMoving(true);
    await handleMovePage();
    setIsMoving(false);
  }, [handleMovePage]);

  return (
    <ModalCore isOpen={isOpen} width={EModalWidth.LG} position={EModalPosition.TOP} handleClose={handleClose}>
      <Combobox
        as="div"
        value={selectedValue}
        onChange={(val: TMovePageSelectedValue) => {
          setSelectedValue(val);
          setSearchTerm("");
          moveButtonRef.current?.focus();
        }}
      >
        <MovePageModalInput
          canPageBeMovedToTeamspace={canPageBeMovedToTeamspace}
          canPageBeMovedToWiki={canPageBeMovedToWiki}
          searchTerm={searchTerm}
          updateSearchTerm={setSearchTerm}
        />
        <MovePageModalBody
          canPageBeMovedToTeamspace={canPageBeMovedToTeamspace}
          canPageBeMovedToWiki={canPageBeMovedToWiki}
          searchTerm={searchTerm}
          workspaceSlug={workspaceSlug}
        />
      </Combobox>
      <MovePageModalFooter
        onClose={handleClose}
        onMove={() => void handleMove()}
        isMoving={isMoving}
        disabled={!selectedValue}
      />
    </ModalCore>
  );
});
