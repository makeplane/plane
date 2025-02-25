"use client";

import { observer } from "mobx-react";

// icons
import { X } from "lucide-react";

type Props = {
  handleRemove: (val: string) => void;
  values: string[];
};

export const AppliedAdditionalPropertiesFilters: React.FC<Props> = observer((props) => {
  const { handleRemove, values } = props;

  return (
    <>
      {values.map((element) => (
        <div key={element} className="flex items-center gap-1 rounded bg-custom-background-80 p-1 text-xs">
          {element}
          <button
            type="button"
            className="grid place-items-center text-custom-text-300 hover:text-custom-text-200"
            onClick={() => handleRemove(element)}
          >
            <X size={10} strokeWidth={2} />
          </button>
        </div>
      ))}
    </>
  );
});
