"use client";

import { observer } from "mobx-react";

// icons
import { X } from "lucide-react";
import { EIconSize } from "@plane/constants";
import { TStateGroups } from "@plane/types";
import { StateGroupIcon } from "@plane/ui";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedStateGroupFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values } = props;

  return (
    <>
      {values.map((stateGroup) => (
        <div key={stateGroup} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
          <StateGroupIcon stateGroup={stateGroup as TStateGroups} size={EIconSize.SM} />
          {stateGroup}
          <button
            type="button"
            className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
            onClick={() => handleRemove(stateGroup)}
          >
            <X size={10} strokeWidth={2} />
          </button>
        </div>
      ))}
    </>
  );
});
