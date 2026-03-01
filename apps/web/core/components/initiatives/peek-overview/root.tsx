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

import type { FC } from "react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// Plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import type { TInitiativeStates } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import { InitiativeScopeModals } from "../common/scope-modals";
import { InitiativeView } from "./view";

export const InitiativePeekOverview = observer(function InitiativePeekOverview() {
  // store hook
  const { allowPermissions } = useUserPermissions();

  const {
    initiative: { peekInitiative, fetchInitiativeDetails, getInitiativeById, updateInitiative },
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

  // Check if initiative is editable, based on user role
  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE,
    peekInitiative.workspaceSlug
  );

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
        disabled={!isEditable}
        handleInitiativeStateUpdate={handleInitiativeStateUpdate}
        handleInitiativeLabelUpdate={handleInitiativeLabelUpdate}
      />
      <InitiativeScopeModals workspaceSlug={peekInitiative.workspaceSlug} initiativeId={peekInitiative.initiativeId} />
    </>
  );
});
