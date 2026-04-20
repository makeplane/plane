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

import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TInitiativeStates } from "@plane/types";
// plane web imports
import { LayoutRoot } from "@/components/common/layout";
import { EpicPeekOverview } from "@/components/epics/peek-overview";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiativeDetailPermissions } from "@/store/initiatives/permissions/root";
// local imports
import { InitiativeEmptyState } from "./empty-state";
import { InitiativeMainContentRoot } from "./main/root";
import { InitiativeSidebarRoot } from "./sidebar/root";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
};

export const InitiativeDetailRoot = observer(function InitiativeDetailRoot(props: Props) {
  const { workspaceSlug, initiativeId } = props;
  // store hooks
  const {
    initiative: { getInitiativeById, updateInitiative, fetchInitiativeAnalytics, permissions },
  } = useInitiatives();

  const { t } = useTranslation();

  // derived values
  const initiative = getInitiativeById(initiativeId);

  // Get instances locally — never pass these as props
  const labelPerms = permissions.getLabelPermissions(workspaceSlug);
  const commentPerms = permissions.getCommentPermissions(workspaceSlug, initiativeId);

  const allPermissions: TInitiativeDetailPermissions = {
    // ── Initiative-level ─────────────────────────────────────────────
    canEdit: permissions.getCanEdit(workspaceSlug, initiativeId),
    canDelete: permissions.getCanDelete(workspaceSlug, initiativeId),
    canReact: permissions.getCanReact(workspaceSlug, initiativeId),
    canEditProperty: (property) => permissions.getCanEditProperty(workspaceSlug, initiativeId, property),

    // ── Links ────────────────────────────────────────────────────────
    canAddLink: permissions.getCanAddLink(workspaceSlug, initiativeId),
    canEditLink: permissions.getCanEditLink(workspaceSlug, initiativeId),
    canDeleteLink: permissions.getCanDeleteLink(workspaceSlug, initiativeId),

    // ── Attachments ──────────────────────────────────────────────────
    canAddAttachment: permissions.getCanAddAttachment(workspaceSlug, initiativeId),
    canDeleteAttachment: (attachmentId) =>
      permissions.getCanDeleteAttachment(workspaceSlug, initiativeId, attachmentId),

    // ── Scope ────────────────────────────────────────────────────────
    canAddScope: permissions.getCanAddScope(workspaceSlug, initiativeId),
    canAddProject: permissions.getCanAddProject(workspaceSlug, initiativeId),
    canRemoveProject: permissions.getCanRemoveProject(workspaceSlug, initiativeId),
    canAddEpic: permissions.getCanAddEpic(workspaceSlug, initiativeId),
    canRemoveEpic: permissions.getCanRemoveEpic(workspaceSlug, initiativeId),

    // ── Labels (plain object, NOT the instance) ───────────────────────
    labels: {
      canCreate: labelPerms.canCreate,
      canEdit: (labelId: string) => labelPerms.getCanEdit(labelId),
      canDelete: (labelId: string) => labelPerms.getCanDelete(labelId),
      canReorder: (labelId: string) => labelPerms.getCanReorder(labelId),
    },

    // ── Comments (plain object, NOT the instance) ─────────────────────
    comments: {
      canCreate: commentPerms.canCreate,
      canEdit: (commentId: string) => commentPerms.getCanEdit(commentId),
      canDelete: (commentId: string) => commentPerms.getCanDelete(commentId),
      canReact: (commentId: string) => commentPerms.getCanReact(commentId),
    },
  };

  // handlers
  const handleInitiativeLabelUpdate = (labelIds: string[]) => {
    if (!initiativeId) return;
    try {
      updateInitiative(workspaceSlug?.toString(), initiativeId, { label_ids: labelIds }).then(() => {
        fetchInitiativeAnalytics(workspaceSlug, initiativeId);
      });
    } catch {
      setToast({
        title: t("toast.error"),
        type: TOAST_TYPE.ERROR,
        message: t("initiatives.toast.label_update_error"),
      });
    }
  };

  const handleInitiativeStateUpdate = (state: TInitiativeStates) => {
    try {
      if (!initiativeId) return;
      updateInitiative(workspaceSlug, initiativeId, { state }).then(() => {
        fetchInitiativeAnalytics(workspaceSlug, initiativeId);
      });
    } catch {
      setToast({
        title: t("toast.error"),
        type: TOAST_TYPE.ERROR,
        message: t("initiatives.toast.state_update_error"),
      });
    }
  };

  return (
    <LayoutRoot
      renderEmptyState={!initiative}
      emptyStateComponent={<InitiativeEmptyState workspaceSlug={workspaceSlug} />}
    >
      <InitiativeMainContentRoot
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        permissions={allPermissions}
      />
      <InitiativeSidebarRoot
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        permissions={allPermissions}
        handleInitiativeStateUpdate={handleInitiativeStateUpdate}
        handleInitiativeLabelUpdate={handleInitiativeLabelUpdate}
      />
      <EpicPeekOverview />
    </LayoutRoot>
  );
});
