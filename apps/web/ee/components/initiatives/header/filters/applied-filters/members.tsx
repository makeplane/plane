"use client";

import { observer } from "mobx-react";
import { X } from "lucide-react";
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember, useUser } from "@/hooks/store";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedMembersFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values } = props;

  const { getUserDetails } = useMember();
  const { data: currentUser } = useUser();

  return (
    <>
      {values.map((memberId) => {
        const memberDetails = getUserDetails(memberId);

        if (!memberDetails) return null;

        return (
          <div key={memberId} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <Avatar
              name={memberDetails.display_name}
              src={getFileURL(memberDetails.avatar_url)}
              showTooltip={false}
              size={"sm"}
            />
            <span className="normal-case">
              {currentUser?.id === memberDetails.id ? "You" : memberDetails?.display_name}
            </span>
            <button
              type="button"
              className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
              onClick={() => handleRemove(memberId)}
            >
              <X size={10} strokeWidth={2} />
            </button>
          </div>
        );
      })}
    </>
  );
});
