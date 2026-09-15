/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link } from "react-router";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import { PageIcon } from "@plane/propel/icons";
import type { TPage } from "@plane/types";
import { cn } from "@plane/utils";
// services
import { ProjectPageService } from "@/services/page/project-page.service";

const projectPageService = new ProjectPageService();

type Props = {
  pageId: string;
  projectId: string | undefined;
  workspaceSlug: string | undefined;
};

export function EditorPageEmbedRoot(props: Props) {
  const { pageId, projectId, workspaceSlug } = props;
  // states
  const [page, setPage] = useState<TPage | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!workspaceSlug || !projectId || !pageId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    projectPageService
      .fetchById(workspaceSlug, projectId, pageId, false)
      .then((res) => setPage(res))
      .catch(() => setPage(undefined))
      .finally(() => setIsLoading(false));
  }, [workspaceSlug, projectId, pageId]);

  // the page this link lives on, so the opened page's breadcrumbs follow where it was clicked from
  const { pageId: currentPageId } = useParams();
  const fromQuery = currentPageId ? `?from=${currentPageId}` : "";
  const pageLink =
    workspaceSlug && projectId ? `/${workspaceSlug}/projects/${projectId}/pages/${pageId}${fromQuery}` : undefined;

  if (isLoading) {
    return (
      <span className="not-prose mx-0.5 inline-flex animate-pulse items-center gap-1 rounded-md border-[0.5px] border-subtle bg-layer-1 px-1.5 py-0.5 text-13 text-secondary no-underline">
        <PageIcon className="size-3.5 flex-shrink-0" />
        <span className="h-3 w-16 rounded bg-layer-2" />
      </span>
    );
  }

  if (!page || !pageLink) {
    return (
      <span className="not-prose mx-0.5 inline-flex items-center gap-1 rounded-md border-[0.5px] border-subtle bg-layer-1 px-1.5 py-0.5 text-13 text-tertiary no-underline">
        <PageIcon className="size-3.5 flex-shrink-0" />
        Untitled page
      </span>
    );
  }

  return (
    <Link
      to={pageLink}
      className={cn(
        "not-prose mx-0.5 inline-flex max-w-[280px] items-center gap-1 truncate rounded-md border-[0.5px] border-subtle bg-layer-1 px-1.5 py-0.5 text-13 font-medium text-primary no-underline hover:bg-layer-1-hover"
      )}
    >
      {page.logo_props?.in_use ? (
        <Logo logo={page.logo_props} size={14} type="lucide" />
      ) : (
        <PageIcon className="size-3.5 flex-shrink-0" />
      )}
      <span className="truncate">{page.name || "Untitled"}</span>
    </Link>
  );
}
