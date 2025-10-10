"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import { Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { usePlatformOS } from "@/hooks/use-platform-os";

export type TReadonlyLabelsProps = {
  className?: string;
  hideIcon?: boolean;
  value: string[];
  placeholder?: string;
  showCount?: boolean;
  length?: number;
  projectId: string | undefined;
  workspaceSlug: string;
};

export const ReadonlyLabels: React.FC<TReadonlyLabelsProps> = observer((props) => {
  const { className, value, projectId, workspaceSlug } = props;

  const { getLabelById, fetchProjectLabels } = useLabel();
  const { isMobile } = usePlatformOS();
  const labels = value
    .map((labelId) => getLabelById(labelId))
    .filter((label): label is NonNullable<typeof label> => Boolean(label));

  useEffect(() => {
    if (projectId) {
      fetchProjectLabels(workspaceSlug?.toString(), projectId);
    }
  }, [value, projectId, workspaceSlug]);

  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      {labels && (
        <>
          <Tooltip
            position="top"
            tooltipHeading="Labels"
            tooltipContent={labels.map((l) => l?.name).join(", ")}
            isMobile={isMobile}
            disabled={labels.length === 0}
          >
            <div className="h-full flex items-center gap-1 rounded py-1 text-sm">
              <span className="h-2 w-2 flex-shrink-0 rounded-full bg-custom-primary" />
              <span>{value.length}</span>
              <span>Labels</span>
            </div>
          </Tooltip>
        </>
      )}
    </div>
  );
});
