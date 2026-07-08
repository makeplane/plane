/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { FileText } from "lucide-react";
import { Link } from "react-router";
// plane imports
import { cn } from "@plane/utils";

type Props = {
  pageId: string;
  pageTitle: string;
  workspaceSlug: string;
  projectId: string;
};

export function PageEmbedCard(props: Props) {
  const { pageId, pageTitle, workspaceSlug, projectId } = props;

  if (!pageId) return null;

  const href = `/${workspaceSlug}/projects/${projectId}/pages/${pageId}`;

  return (
    <div contentEditable={false} className="my-1">
      <Link
        to={href}
        className={cn(
          "not-prose flex items-center gap-2 rounded-md border border-strong bg-layer-1 px-3 py-2",
          "text-13 font-medium text-primary no-underline transition-colors hover:bg-layer-transparent-hover"
        )}
      >
        <FileText className="size-4 flex-shrink-0 text-tertiary" />
        <span className="truncate">{pageTitle || "Untitled"}</span>
      </Link>
    </div>
  );
}
