"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane web components
import {
  WorkspaceWorklogFilterRoot,
  WorkspaceWorklogDownloadButton,
  WorkspaceWorklogAppliedFilterRoot,
} from "@/plane-web/components/worklogs";

type TWorkspaceWorklogHeaderRoot = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogHeaderRoot: FC<TWorkspaceWorklogHeaderRoot> = observer((props) => {
  const { workspaceSlug, workspaceId } = props;

  return (
    <div className="pb-4 space-y-4 border-b border-custom-border-100">
      <div className="relative flex justify-between items-center gap-2">
        <WorkspaceWorklogFilterRoot workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
        <WorkspaceWorklogDownloadButton workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
      </div>
      <WorkspaceWorklogAppliedFilterRoot workspaceSlug={workspaceSlug} workspaceId={workspaceId} />
    </div>
  );
});
