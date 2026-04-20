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

import { useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TIssue } from "@plane/types";
import type { EditorRefApi } from "@plane/editor";
import { IssueDetailRoot } from "@/components/issues/issue-detail/root";
import { EpicDetailRoot } from "@/components/epics/details/root";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { ArchiveIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";
import { Banner } from "@plane/propel/banner";

export type TWorkItemDetailRoot = {
  workspaceSlug: string;
  projectId: string;
  workItemId: string;
  workItem: TIssue;
};

export const WorkItemDetailRoot = observer(function WorkItemDetailRoot(props: TWorkItemDetailRoot) {
  const { workspaceSlug, projectId, workItemId, workItem } = props;
  // router
  const router = useAppRouter();
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // derived values
  const isEpic = !!workItem.is_epic;
  const isArchived = !!workItem.archived_at;

  return (
    <>
      {isArchived && (
        <Banner
          variant="warning"
          title={`This ${isEpic ? "epic" : "work item"} has been archived. Visit the Archives section to restore it.`}
          icon={<ArchiveIcon className="size-4" />}
          action={
            <Button
              variant="secondary"
              onClick={() =>
                router.push(`/${workspaceSlug}/projects/${projectId}/archives/${isEpic ? "epics" : "issues"}/`)
              }
            >
              Go to archives
            </Button>
          }
          className="border-b border-subtle"
        />
      )}
      {isEpic ? (
        <EpicDetailRoot editorRef={editorRef} workspaceSlug={workspaceSlug} projectId={projectId} epicId={workItemId} />
      ) : (
        <IssueDetailRoot
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          workItemId={workItemId}
          is_archived={!!workItem.archived_at}
        />
      )}
    </>
  );
});
