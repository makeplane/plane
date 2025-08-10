import React from "react";
import { observer } from "mobx-react";
// helpers
import { cn } from "@plane/utils";
// hooks
import { TProject } from "@/plane-web/types/projects";

type Props = {
  project: TProject;
};

export const SpreadsheetMembersColumn: React.FC<Props> = observer((props: Props) => {
  const { project } = props;

  // derived values
  const membersCount = project.members?.length ?? 0;

  return (
    <div
      className={cn(
        "flex h-11 w-full items-center border-b-[0.5px] border-custom-border-200 px-4 py-1 text-xs hover:bg-custom-background-80 group-[.selected-project-row]:bg-custom-primary-100/5 group-[.selected-project-row]:hover:bg-custom-primary-100/10"
      )}
    >
      {membersCount}
    </div>
  );
});
