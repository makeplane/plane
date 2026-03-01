/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import { EFileAssetType, EIssueServiceType } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
// components
import { InfoSection } from "@/components/common/layout/main/sections/info-root";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
// local components
import { useEpicOperations } from "../helper";
import { EpicInfoActionItems } from "./info-section/action-items";
import { EpicInfoIndicatorItem } from "./info-section/indicator-item";

type Props = {
  editorRef: React.RefObject<EditorRefApi>;
  workspaceSlug: string;
  projectId: string;
  epicId: string;
  disabled?: boolean;
};

export const EpicInfoSection = observer(function EpicInfoSection(props: Props) {
  const { editorRef, workspaceSlug, projectId, epicId, disabled = false } = props;
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
      editorRef={editorRef}
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
      onDescriptionSubmit={async (value, isMigrationUpdate) =>
        epicOperations.update(workspaceSlug, projectId, issue.id, {
          description_html: value,
          ...(isMigrationUpdate ? { skip_activity: "true" } : {}),
        })
      }
      indicatorElement={<EpicInfoIndicatorItem epicId={epicId} />}
      actionElement={
        <EpicInfoActionItems
          editorRef={editorRef}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          epicId={epicId}
          disabled={disabled}
        />
      }
      fileAssetType={EFileAssetType.ISSUE_DESCRIPTION}
      identifierElement={
        <IssueIdentifier issueId={epicId} projectId={projectId} size="md" enableClickToCopyIdentifier />
      }
      disabled={disabled}
      issueSequenceId={issue.sequence_id}
    />
  );
});
