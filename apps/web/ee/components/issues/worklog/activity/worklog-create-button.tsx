"use client";

import { FC, useRef } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
import { Button, Popover } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
// plane web components
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";
import { WorklogCreate } from "../create-update";

type TIssueActivityWorklogCreateButton = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueActivityWorklogCreateButton: FC<TIssueActivityWorklogCreateButton> = observer((props) => {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  // hooks
  const { isWorklogsEnabledByProjectId } = useWorkspaceWorklogs();
  // ref
  const popoverButtonRef = useRef<HTMLButtonElement | null>(null);

  if (!isWorklogsEnabledByProjectId(projectId)) return <></>;
  return (
    <Popover
      popoverButtonRef={popoverButtonRef}
      disabled={disabled}
      buttonClassName={cn("w-full outline-none", { "cursor-not-allowed": disabled })}
      button={
        <Button size="sm" variant="outline-primary" prependIcon={<Plus />} className="border-0">
          Log work
        </Button>
      }
      popperPosition="bottom-end"
      panelClassName="w-72 my-1 rounded border-[0.5px] border-custom-border-300 bg-custom-background-100 p-3 text-xs shadow-custom-shadow-rg focus:outline-none"
    >
      <WorklogCreate
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        handleClose={() => popoverButtonRef.current?.click()}
      />
    </Popover>
  );
});
