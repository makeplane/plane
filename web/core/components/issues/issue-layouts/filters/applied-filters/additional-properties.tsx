"use client";

import { observer } from "mobx-react";

// icons
import { Lock, X } from "lucide-react";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
  lockedValues?: string[];
};

export const AppliedAdditionalPropertiesFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values, editable, lockedValues = [] } = props;

  return (
    <>
      {values.map((element) => {
        const isLocked = lockedValues.includes(element);
        const canRemove = editable && !isLocked;

        return (
          <div
            key={element}
            className={`flex items-center gap-1 rounded p-1 text-xs ${
              isLocked ? "bg-custom-background-90" : "bg-custom-background-80"
            }`}
          >
            {isLocked && <Lock size={10} className="text-custom-text-400" strokeWidth={2} />}
            <span className={isLocked ? "text-custom-text-400" : ""}>{element}</span>
            {canRemove && (
              <button
                type="button"
                className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
                onClick={() => handleRemove(element)}
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
