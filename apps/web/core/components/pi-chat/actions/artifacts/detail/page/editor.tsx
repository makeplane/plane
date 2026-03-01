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

import { useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { TSearchEntityRequestPayload } from "@plane/types";
// components
import { DocumentEditor } from "@/components/editor/document/editor";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
// services
import { WorkspaceService } from "@/services/workspace.service";
const workspaceService = new WorkspaceService();

type Props = {
  workspaceSlug: string;
  projectId?: string;
  initialValue: string;
  artifactId: string;
  onChange: (json: object, html: string) => void;
  editorRef: React.RefObject<EditorRefApi>;
};

export const PagePreviewEditor = observer(function PagePreviewEditor(props: Props) {
  const { workspaceSlug, projectId, artifactId, initialValue, onChange, editorRef } = props;
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = useMemo(
    () => (workspaceSlug ? (getWorkspaceBySlug(workspaceSlug)?.id ?? "") : ""),
    [getWorkspaceBySlug, workspaceSlug]
  );

  return (
    <DocumentEditor
      disabledExtensions={["issue-embed", "attachments", "image", "drawio", "comments", "page-embed", "nested-pages"]}
      editable
      id={`page-artifact-${artifactId}`}
      value={initialValue}
      onChange={onChange}
      containerClassName="min-h-[120px] border-none pl-4 -ml-4"
      uploadFile={async () => ""}
      duplicateFile={async () => ""}
      searchMentionCallback={async (payload: TSearchEntityRequestPayload) =>
        await workspaceService.searchEntity(workspaceSlug?.toString() ?? "", {
          ...payload,
          project_id: projectId?.toString() ?? "",
        })
      }
      bubbleMenuEnabled
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
      ref={editorRef}
    />
  );
});
