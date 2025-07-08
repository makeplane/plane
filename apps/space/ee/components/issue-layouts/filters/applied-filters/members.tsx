"use client";

import { observer } from "mobx-react";
import { X } from "lucide-react";
// ui
import { Avatar } from "@plane/ui";
import { useMember } from "@/hooks/store/use-member";
// types

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedMembersFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values } = props;

  const { getMemberById } = useMember();

  return (
    <>
      {values.map((memberId) => {
        const memberDetails = getMemberById(memberId);

        if (!memberDetails) return null;

        return (
          <div key={memberId} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
            <Avatar name={memberDetails.member__display_name} src={memberDetails.member__avatar} showTooltip={false} />
            <span className="normal-case">{memberDetails.member__display_name}</span>
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
