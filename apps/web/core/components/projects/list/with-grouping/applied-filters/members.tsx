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
import { CloseIcon } from "@plane/propel/icons";
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// types
import { useMember } from "@/hooks/store/use-member";

type Props = {
  handleRemove: (val: string) => void;
  appliedFilters: string[];
  editable: boolean | undefined;
};

export const AppliedMembersFilters = observer(function AppliedMembersFilters(props: Props) {
  const { handleRemove, appliedFilters, editable } = props;
  // store hooks
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();

  return (
    <>
      {appliedFilters.map((memberId) => {
        const memberDetails = getWorkspaceMemberDetails(memberId)?.member;

        if (!memberDetails) return null;

        return (
          <div key={memberId} className="flex items-center gap-1 rounded-sm bg-layer-1 p-1 text-11">
            <Avatar name={memberDetails.display_name} src={getFileURL(memberDetails.avatar_url)} showTooltip={false} />
            <span className="normal-case">{memberDetails.display_name}</span>
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(memberId)}
              >
                <CloseIcon height={10} width={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
