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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// Plane imports
import type { TInitiativeStates } from "@plane/types";
// hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import type { TInitiativeDetailPermissions } from "@/store/initiatives/permissions/root";
// local imports
import { InitiativeScopeModals } from "../common/scope-modals";
import { InitiativeView } from "./view";

export const InitiativePeekOverview = observer(function InitiativePeekOverview() {
  const {
    initiative: { peekInitiative, fetchInitiativeDetails, getInitiativeById, updateInitiative, permissions },
  } = useInitiatives();
  // state
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initiative details
  useEffect(() => {
    const fetchInitiative = async () => {
      if (peekInitiative) {
        try {
          setError(false);
          setIsLoading(true);
          await fetchInitiativeDetails(peekInitiative.workspaceSlug, peekInitiative.initiativeId);
        } catch (error) {
          setError(true);
          console.error("Error fetching initiative", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchInitiative();
  }, [peekInitiative, fetchInitiativeDetails]);

  if (!peekInitiative?.workspaceSlug || !peekInitiative?.initiativeId) return null;

  const initiative = getInitiativeById(peekInitiative.initiativeId);

  // Get instances locally — never pass these as props
  const labelPerms = permissions.getLabelPermissions(peekInitiative.workspaceSlug);
  const commentPerms = permissions.getCommentPermissions(peekInitiative.workspaceSlug, peekInitiative.initiativeId);

  const peekPermissions: TInitiativeDetailPermissions = {
    // ── Initiative-level ─────────────────────────────────────────────
    canEdit: permissions.getCanEdit(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canDelete: permissions.getCanDelete(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canReact: permissions.getCanReact(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canEditProperty: (property) =>
      permissions.getCanEditProperty(peekInitiative.workspaceSlug, peekInitiative.initiativeId, property),

    // ── Links ────────────────────────────────────────────────────────
    canAddLink: permissions.getCanAddLink(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canEditLink: permissions.getCanEditLink(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canDeleteLink: permissions.getCanDeleteLink(peekInitiative.workspaceSlug, peekInitiative.initiativeId),

    // ── Attachments ──────────────────────────────────────────────────
    canAddAttachment: permissions.getCanAddAttachment(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canDeleteAttachment: (attachmentId) =>
      permissions.getCanDeleteAttachment(peekInitiative.workspaceSlug, peekInitiative.initiativeId, attachmentId),

    // ── Scope ────────────────────────────────────────────────────────
    canAddScope: permissions.getCanAddScope(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canAddProject: permissions.getCanAddProject(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canRemoveProject: permissions.getCanRemoveProject(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canAddEpic: permissions.getCanAddEpic(peekInitiative.workspaceSlug, peekInitiative.initiativeId),
    canRemoveEpic: permissions.getCanRemoveEpic(peekInitiative.workspaceSlug, peekInitiative.initiativeId),

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

  const handleInitiativeStateUpdate = async (stateId: TInitiativeStates) => {
    if (!initiative) return;
    await updateInitiative(peekInitiative.workspaceSlug, peekInitiative.initiativeId, { state: stateId });
  };

  const handleInitiativeLabelUpdate = async (labelIds: string[]) => {
    if (!initiative) return;
    await updateInitiative(peekInitiative.workspaceSlug, peekInitiative.initiativeId, { label_ids: labelIds });
  };

  return (
    <>
      <InitiativeView
        workspaceSlug={peekInitiative.workspaceSlug}
        initiativeId={peekInitiative.initiativeId}
        isLoading={isLoading}
        isError={error}
        permissions={peekPermissions}
        handleInitiativeStateUpdate={handleInitiativeStateUpdate}
        handleInitiativeLabelUpdate={handleInitiativeLabelUpdate}
      />
      <InitiativeScopeModals workspaceSlug={peekInitiative.workspaceSlug} initiativeId={peekInitiative.initiativeId} />
    </>
  );
});
