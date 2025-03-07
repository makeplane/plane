"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { EIssueServiceType } from "@plane/constants";
import { EFileAssetType } from "@plane/types/src/enums";
// hooks
import { useIssueDetail } from "@/hooks/store";
// components
import { InfoSection } from "@/plane-web/components/common/layout/main/sections/info-root";
// local components
import { useEpicOperations } from "../helper";
import { EpicInfoActionItems } from "./info-section/action-items";
import { EpicInfoIndicatorItem } from "./info-section/indicator-item";

type Props = {
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicInfoSection: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, epicId, disabled = false } = props;
  // store hooks
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);

  // helper hooks
  const epicOperations = useEpicOperations();

  // derived values
  const issue = epicId ? getIssueById(epicId) : undefined;

  if (!issue || !issue.project_id) return <></>;

  return (
    <InfoSection
      workspaceSlug={workspaceSlug}
      projectId={issue.project_id}
      itemId={issue.id}
      titleValue={issue.name}
      descriptionValue={issue.description_html}
      onTitleSubmit={async (value) =>
        epicOperations.update(workspaceSlug, projectId, issue.id, {
          name: value,
        })
      }
      onDescriptionSubmit={async (value) =>
        epicOperations.update(workspaceSlug, projectId, issue.id, {
          description_html: value,
        })
      }
      indicatorElement={<EpicInfoIndicatorItem epicId={epicId} />}
      actionElement={
        <EpicInfoActionItems workspaceSlug={workspaceSlug} projectId={projectId} epicId={epicId} disabled={disabled} />
      }
      fileAssetType={EFileAssetType.ISSUE_DESCRIPTION}
      disabled={disabled}
    />
  );
});
