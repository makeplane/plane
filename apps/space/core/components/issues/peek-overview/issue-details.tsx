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

import { observer } from "mobx-react";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { WorkItemIdentifier } from "@/components/issues/work-item-identifier";
import { usePublish } from "@/hooks/store/publish";
// types
import type { IIssue } from "@/types/issue";
// local imports
import { IssueReactions } from "./issue-reaction";

type Props = {
  anchor: string;
  issueDetails: IIssue;
};

export const PeekOverviewIssueDetails = observer(function PeekOverviewIssueDetails(props: Props) {
  const { anchor, issueDetails } = props;
  // store hooks
  const { project_details, workspace: workspaceID } = usePublish(anchor);
  // derived values
  const description = issueDetails.description_html;

  return (
    <div className="space-y-2">
      <h6 className="text-14 font-medium text-placeholder">
        <WorkItemIdentifier
          workItem={issueDetails}
          projectIdentifier={project_details?.identifier || ""}
          showTypeName
        />
      </h6>
      <h4 className="break-words text-20 font-medium">{issueDetails.name}</h4>
      {description && description !== "" && description !== "<p></p>" && (
        <RichTextEditor
          editable={false}
          anchor={anchor}
          id={issueDetails.id}
          initialValue={description}
          workspaceId={workspaceID?.toString() ?? ""}
        />
      )}
      <IssueReactions anchor={anchor} />
    </div>
  );
});
