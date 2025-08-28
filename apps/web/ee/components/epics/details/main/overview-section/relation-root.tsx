"use client";
import React, { FC } from "react";
import { isEmpty } from "lodash";
import { observer } from "mobx-react";
import { LayersIcon } from "lucide-react";
import { EIssueServiceType } from "@plane/types";
import { getButtonStyling } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { RelationActionButton, RelationsCollapsibleContent } from "@/components/issues/issue-detail-widgets/relations";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// plane web
import { SectionEmptyState } from "@/plane-web/components/common/layout/main/common/empty-state";

type Props = {
  workspaceSlug: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicRelationsOverviewRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, epicId, disabled = false } = props;
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
        <>
          <SectionEmptyState
            heading="No relations yet"
            subHeading="Start adding relations to manage and track the progress of the epic."
            icon={<LayersIcon className="size-4" />}
            actionElement={
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
            }
          />
        </>
      ) : (
        <RelationsCollapsibleContent
          workspaceSlug={workspaceSlug}
          issueId={epicId}
          disabled={disabled}
          issueServiceType={EIssueServiceType.EPICS}
        />
      )}
    </>
  );
});
