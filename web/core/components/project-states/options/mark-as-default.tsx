"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useProjectState } from "@/hooks/store";

type TStateMarksAsDefault = { workspaceSlug: string; projectId: string; stateId: string; isDefault: boolean };

export const StateMarksAsDefault: FC<TStateMarksAsDefault> = observer((props) => {
  const { workspaceSlug, projectId, stateId, isDefault } = props;
  // hooks
  const { markStateAsDefault } = useProjectState();
  // states
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsDefault = async () => {
    if (!workspaceSlug || !projectId || !stateId || isDefault) return;
    setIsLoading(true);

    try {
      setIsLoading(false);
      await markStateAsDefault(workspaceSlug, projectId, stateId);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={cn(
        "text-sm whitespace-nowrap transition-colors",
        isDefault ? "text-custom-text-300" : "text-custom-text-200 hover:text-custom-text-100"
      )}
      disabled={isDefault || isLoading}
      onClick={handleMarkAsDefault}
    >
      {isLoading ? "Marking as default" : isDefault ? `Default` : `Mark as default`}
    </button>
  );
});
