"use client";

import { observer } from "mobx-react";

// icons
import { X } from "lucide-react";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
  editable: boolean | undefined;
};

export const AppliedAdditionalPropertiesFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values, editable } = props;

  return (
    <>
      {values.map((element) => {
        const canRemove = editable;

        return (
          <div
            key={element}
            className="flex items-center gap-1 rounded p-1 text-xs bg-custom-background-80"
          >
            <span>{element}</span>
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
