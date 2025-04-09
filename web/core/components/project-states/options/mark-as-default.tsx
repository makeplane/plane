"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { TStateOperationsCallbacks } from "@plane/types";
import { cn } from "@plane/utils";

type TStateMarksAsDefault = {
  stateId: string;
  isDefault: boolean;
  markStateAsDefaultCallback: TStateOperationsCallbacks["markStateAsDefault"];
};

export const StateMarksAsDefault: FC<TStateMarksAsDefault> = observer((props) => {
  const { stateId, isDefault, markStateAsDefaultCallback } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsDefault = async () => {
    if (!stateId || isDefault) return;
    setIsLoading(true);

    try {
      setIsLoading(false);
      await markStateAsDefaultCallback(stateId);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={cn(
        "text-xs whitespace-nowrap transition-colors",
        isDefault ? "text-custom-text-300" : "text-custom-text-200 hover:text-custom-text-100"
      )}
      disabled={isDefault || isLoading}
      onClick={handleMarkAsDefault}
    >
      {isLoading ? "Marking as default" : isDefault ? `Default` : `Mark as default`}
    </button>
  );
});
