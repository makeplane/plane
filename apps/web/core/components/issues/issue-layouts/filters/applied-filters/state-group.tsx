"use client";

import { observer } from "mobx-react";

// icons
import { EIconSize } from "@plane/constants";
import { CloseIcon, StateGroupIcon } from "@plane/propel/icons";
import type { TStateGroups } from "@plane/types";

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
            <CloseIcon height={10} width={10} strokeWidth={2} />
          </button>
        </div>
      ))}
    </>
  );
});
