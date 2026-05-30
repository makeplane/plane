/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { RichTextEditor } from "@/components/editor/rich-text";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  workspaceSlug: string;
  articleId: string;
  descriptionHtml: string;
};

// Renders stored rich content read-only. Reader trusts the sanitized
// `description_html` only (never the json). The web RichTextEditor wrapper is
// used (NOT DocumentEditor — that is collaborative/Hocuspocus-backed). Asset
// URLs fall back to the workspace path when projectId is undefined.
export const HelpContentRenderer = observer(function HelpContentRenderer({
  workspaceSlug,
  articleId,
  descriptionHtml,
}: Props) {
  const { getWorkspaceBySlug } = useWorkspace();
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;

  if (!workspaceId) return null;

  return (
    <RichTextEditor
      key={articleId}
      id={articleId}
      editable={false}
      initialValue={descriptionHtml}
      projectId={undefined}
      workspaceId={workspaceId}
      workspaceSlug={workspaceSlug}
      containerClassName="p-0 !pl-0 border-none"
      editorClassName="pl-0"
    />
  );
});
