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
import { useParams } from "next/navigation";
// components
import type { TPowerKPageType } from "@/components/power-k/core/types";
import { PowerKMembersMenu } from "@/components/power-k/menus/members";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local imports
import { PowerKInitiativeStatesMenu } from "./states-menu";

type Props = {
  activePage: TPowerKPageType | null;
  handleSelection: (data: unknown) => void;
};

export const PowerKInitiativeContextBasedPages = observer(function PowerKInitiativeContextBasedPages(props: Props) {
  const { activePage, handleSelection } = props;
  // navigation
  const { workspaceSlug, initiativeId } = useParams();
  // store hooks
  const {
    initiative: { getInitiativeById },
  } = useInitiatives();
  const {
    workspace: { getWorkspaceMemberIds },
  } = useMember();
  // derived values
  const initiativeDetails = initiativeId ? getInitiativeById(initiativeId.toString()) : null;
  const workspaceMemberIds = workspaceSlug ? getWorkspaceMemberIds(workspaceSlug.toString()) : [];
  const selectedLead = initiativeDetails?.lead ? [initiativeDetails.lead] : [];

  if (!initiativeDetails) return null;

  return (
    <>
      {/* states menu */}
      {activePage === "change-initiative-state" && (
        <PowerKInitiativeStatesMenu handleSelect={handleSelection} value={initiativeDetails.state} />
      )}
      {activePage === "change-initiative-lead" && (
        <PowerKMembersMenu userIds={workspaceMemberIds} handleSelect={handleSelection} value={selectedLead} />
      )}
    </>
  );
});
