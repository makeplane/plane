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
import { Avatar } from "@plane/propel/avatar";
import { CloseIcon, InfoIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { IStateTransition } from "@plane/types";
import { getFileURL } from "@plane/utils";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";
import { useMember } from "@/hooks/store/use-member";

type Props = {
  stateTransition: IStateTransition;
  parentStateId: string;
  handleApproversUpdate: (memberIds: string[]) => Promise<void>;
};

export const StateTransitionApprovers = observer(function StateTransitionApprovers(props: Props) {
  const { parentStateId, stateTransition, handleApproversUpdate } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getStateById } = useProjectState();
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();
  // derived values
  const parentState = getStateById(parentStateId);
  const transitionState = getStateById(stateTransition.transition_state_id);
  const approverDetails = stateTransition?.approvers
    ?.map((memberId) => getWorkspaceMemberDetails(memberId)?.member)
    .filter((member) => member !== undefined);

  if (!parentState || !transitionState) return <></>;

  return (
    <>
      <hr className="border-t-[1px] border-subtle-1 border-dashed h-[1] w-full pb-2 mt-1.5" />
      <div className="flex flex-col pt-1 pb-2 gap-1">
        <span className="flex items-center gap-1 text-11 text-tertiary font-medium">
          {t("workflows.workflow_states.state_changes.movers.label")}
          <Tooltip tooltipContent={t("workflows.workflow_states.state_changes.movers.tooltip")} position="right">
            <span className="cursor-help">
              <InfoIcon className="size-3 text-placeholder hover:text-tertiary" />
            </span>
          </Tooltip>
        </span>
        <div className="flex p-3 my-1 rounded-md border border-subtle w-full gap-2 items-center">
          {approverDetails.map((member) => {
            return (
              <div key={member.id} className="flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
                <Avatar
                  name={member.display_name}
                  src={getFileURL(member.avatar_url)}
                  showTooltip={false}
                  size={"sm"}
                />
                <span className="normal-case">{member.display_name}</span>
                <button
                  type="button"
                  className="grid place-items-center text-tertiary hover:text-secondary"
                  onClick={() =>
                    void handleApproversUpdate((stateTransition?.approvers ?? []).filter((id) => id !== member.id))
                  }
                >
                  <CloseIcon height={10} width={10} strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
});
