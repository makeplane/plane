"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { ChevronRight } from "lucide-react";
// icons
import { Row, Logo } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  projectId: string;
  count?: number;
  showCount?: boolean;
  isExpanded?: boolean;
};

export const CycleListProjectGroupHeader: FC<Props> = observer((props) => {
  const { projectId, count, showCount = false, isExpanded = false } = props;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const project = getProjectById(projectId);

  if (!project) return null;
  return (
    <Row className="flex items-center gap-2 flex-shrink-0 py-2.5">
      <ChevronRight
        className={cn("h-4 w-4 text-custom-sidebar-text-300 duration-300 ", {
          "rotate-90": isExpanded,
        })}
        strokeWidth={2}
      />
      <div className="flex size-4 flex-shrink-0 items-center justify-center overflow-hidden">
        <Logo logo={project.logo_props} size={16} />
      </div>
      <div className="relative flex w-full flex-row items-center gap-1 overflow-hidden">
        <div className="inline-block line-clamp-1 truncate font-medium text-custom-text-100">{project.name}</div>
        {showCount && <div className="pl-2 text-sm font-medium text-custom-text-300">{`${count ?? "0"}`}</div>}
      </div>
    </Row>
  );
});
