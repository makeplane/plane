"use client";
import React, { FC } from "react";
import { isEmpty } from "lodash";
import { observer } from "mobx-react";
import { LayersIcon } from "lucide-react";
import { EIssueServiceType } from "@plane/constants";
import { getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
import { RelationActionButton, RelationsCollapsibleContent } from "@/components/issues";
import { useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicRelationsOverviewRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  // store hooks
  const {
    relation: { getRelationsByIssueId },
  } = useIssueDetail(EIssueServiceType.EPICS);

  // derived values
  const relations = getRelationsByIssueId(epicId);
  const isRelationsEmpty = Object.values(relations || {}).every((relation) => isEmpty(relation));

  return (
    <>
      {isRelationsEmpty ? (
        <div className="flex flex-col gap-4 items-center justify-center rounded-md border border-custom-border-200 p-10">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center size-8 bg-custom-background-80 rounded">
              <LayersIcon className="size-4" />
            </div>
            <span className="text-sm font-medium">No relations yet</span>
            <span className="text-xs text-custom-text-300">
              Start adding relations to manage and track the progress of the epic.
            </span>
          </div>
          <RelationActionButton
            issueId={epicId}
            issueServiceType={EIssueServiceType.EPICS}
            disabled={disabled}
            customButton={
              <span className={cn(getButtonStyling("accent-primary", "sm"), "font-medium px-2 py-1")}>
                Add relation
              </span>
            }
          />
        </div>
      ) : (
        <RelationsCollapsibleContent
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          issueId={epicId}
          disabled={disabled}
          issueServiceType={EIssueServiceType.EPICS}
        />
      )}
    </>
  );
});
