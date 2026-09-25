/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Avatar } from "@makeplane/propel/components/avatar";
import { CloseOutline } from "@makeplane/propel/icons";
// helpers
import { getFileURL } from "@plane/utils";
// types
import { useMember } from "@/hooks/store/use-member";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedMembersFilters = observer(function AppliedMembersFilters(props: Props) {
  const { handleRemove, values, editable } = props;
  // store hooks
  const {
    workspace: { getWorkspaceMemberDetails },
  } = useMember();

  return (
    <>
      {values.map((memberId) => {
        const memberDetails = getWorkspaceMemberDetails(memberId)?.member;

        if (!memberDetails) return null;

        return (
          <div key={memberId} className="flex items-center gap-1 rounded-sm bg-layer-1 px-1.5 py-1 text-11">
            <Avatar
              alt={memberDetails.display_name}
              fallback={memberDetails.display_name?.[0]?.toUpperCase()}
              src={getFileURL(memberDetails.avatar_url)}
              size="2xs"
            />
            <span className="normal-case">{memberDetails.display_name}</span>
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-tertiary hover:text-secondary"
                onClick={() => handleRemove(memberId)}
              >
                <CloseOutline height={10} width={10} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
