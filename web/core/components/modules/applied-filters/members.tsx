"use client";

import { observer } from "mobx-react";
import { X } from "lucide-react";
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedMembersFilters: React.FC<Props> = observer((props) => {
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
          <div key={memberId} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <Avatar
              name={memberDetails.display_name}
              src={getFileURL(memberDetails.avatar_url)}
              showTooltip={false}
              size={"sm"}
            />
            <span className="normal-case">{memberDetails.display_name}</span>
            {editable && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(memberId)}
              >
                <X size={10} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
});
