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

import { useState } from "react";
import { observer } from "mobx-react";

import { PlusIcon } from "@plane/propel/icons";
// helpers
import { IconButton } from "@plane/propel/icon-button";
import { cn } from "@plane/utils";
// components
import { AddTeamspaceMembersModal } from "./modal";

type TAddTeamspaceMembersButtonProps = {
  teamspaceId: string;
  variant: "icon" | "sidebar";
  isEditingAllowed: boolean;
};

export const AddTeamspaceMembersButton = observer(function AddTeamspaceMembersButton(
  props: TAddTeamspaceMembersButtonProps
) {
  const { teamspaceId, variant, isEditingAllowed } = props;
  // state
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);

  if (!isEditingAllowed) return null;

  return (
    <>
      <AddTeamspaceMembersModal
        teamspaceId={teamspaceId}
        isModalOpen={isAddMembersModalOpen}
        handleModalClose={() => setIsAddMembersModalOpen(false)}
      />
      {variant === "icon" && (
        <IconButton
          variant="secondary"
          size="base"
          icon={PlusIcon}
          onClick={() => setIsAddMembersModalOpen(true)}
          aria-label="Add member"
        />
      )}
      {variant === "sidebar" && (
        <button
          className="group flex items-center gap-x-2 cursor-pointer"
          onClick={() => setIsAddMembersModalOpen(true)}
        >
          <div
            className={cn(
              "flex-shrink-0 size-8 rounded-md inline-flex items-center justify-center",
              "bg-layer-transparent group-hover:bg-layer-transparent-hover active:bg-layer-transparent-active",
              "text-secondary transition-colors"
            )}
          >
            <PlusIcon className="size-5" strokeWidth={2} />
          </div>
          <span className="text-body-xs-medium text-placeholder group-hover:text-tertiary">Add new member</span>
        </button>
      )}
    </>
  );
});
