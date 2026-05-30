/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { RichTextEditor } from "@/components/editor/rich-text";
import { useWorkspace } from "@/hooks/store/use-workspace";

type Props = {
  articleId: string;
  descriptionHtml: string;
};

// Renders stored rich content read-only on the workspace-agnostic /help route.
// The editor needs *a* workspaceId/slug only for its image asset-URL handler;
// /help has no workspace in the URL, so we use any workspace the user belongs to
// (text renders regardless; help images resolve from the global static path once
// authored). Reader trusts the sanitized `description_html` only (never json).
export const HelpContentRenderer = observer(function HelpContentRenderer({ articleId, descriptionHtml }: Props) {
  const { workspaces } = useWorkspace();
  const anyWorkspace = Object.values(workspaces ?? {})[0];
  const workspaceId = anyWorkspace?.id ?? "";
  const workspaceSlug = anyWorkspace?.slug ?? "";

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
