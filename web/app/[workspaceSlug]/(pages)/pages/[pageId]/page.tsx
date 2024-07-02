"use client";

import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
// ui
import { getButtonStyling } from "@plane/ui";
// components
import { LogoSpinner } from "@/components/common";
import { PageHead } from "@/components/core";
import { IssuePeekOverview } from "@/components/issues";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { WorkspacePageRoot } from "@/plane-web/components/pages";
import { useWorkspacePageDetails, useWorkspacePages } from "@/plane-web/hooks/store";

const PageDetailsPage = observer(() => {
  // router
  const { workspaceSlug, pageId } = useParams();
  // store hooks
  const { fetchPageById } = useWorkspacePages();
  const page = useWorkspacePageDetails(pageId?.toString() ?? "");
  const { id, name } = page;
  // fetch page details
  const { error: pageDetailsError } = useSWR(
    pageId ? `PAGE_DETAILS_${pageId}` : null,
    pageId ? () => fetchPageById(pageId.toString()) : null,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  if ((!page || !id) && !pageDetailsError)
    return (
      <div className="size-full grid place-items-center">
        <LogoSpinner />
      </div>
    );

  if (pageDetailsError)
    return (
      <div className="size-full flex flex-col items-center justify-center">
        <h3 className="text-lg font-semibold text-center">Page not found</h3>
        <p className="text-sm text-custom-text-200 text-center mt-3">
          The page you are trying to access doesn{"'"}t exist or you don{"'"}t have permission to view it.
        </p>
        <Link href={`/${workspaceSlug}/pages`} className={cn(getButtonStyling("neutral-primary", "md"), "mt-5")}>
          View other Pages
        </Link>
      </div>
    );

  return (
    <>
      <PageHead title={name} />
      <div className="flex h-full flex-col justify-between">
        <div className="size-full flex-shrink-0 flex flex-col overflow-hidden">
          <WorkspacePageRoot page={page} workspaceSlug={workspaceSlug.toString()} />
          <IssuePeekOverview />
        </div>
      </div>
    </>
  );
});

export default PageDetailsPage;
