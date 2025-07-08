"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
// helpers
import { cn } from "@plane/utils";
// hooks
import { useWorkspaceProjectStates } from "@/plane-web/hooks/store";

type TProjectStateMarksAsDefault = { workspaceSlug: string; stateId: string; isDefault: boolean };

export const ProjectStateMarksAsDefault: FC<TProjectStateMarksAsDefault> = observer((props) => {
  const { workspaceSlug, stateId, isDefault } = props;
  // hooks
  const { markAsDefault } = useWorkspaceProjectStates();
  // states
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsDefault = async () => {
    if (!workspaceSlug || !stateId || isDefault) return;
    setIsLoading(true);

    try {
      setIsLoading(false);
      await markAsDefault(workspaceSlug, stateId);
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
