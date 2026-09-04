/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
// ui
import { Banner } from "@plane/propel/banner";
import { Button } from "@plane/propel/button";
import { ArchiveOutline } from "@makeplane/propel/icons";
import { Skeleton, SkeletonItem } from "@makeplane/propel/components/skeleton";
// components
import { PageHead } from "@/components/core/page-title";
import { IssueDetailRoot } from "@/components/issues/issue-detail";
// constants
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import type { Route } from "./+types/page";

function ArchivedIssueDetailsPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId, archivedIssueId } = params;
  const router = useRouter();
  // states
  // hooks
  const {
    fetchIssue,
    issue: { getIssueById },
  } = useIssueDetail();

  const { getProjectById } = useProject();

  const { isLoading } = useSWR(`ARCHIVED_ISSUE_DETAIL_${workspaceSlug}_${projectId}_${archivedIssueId}`, () =>
    fetchIssue(workspaceSlug, projectId, archivedIssueId)
  );

  // derived values
  const issue = getIssueById(archivedIssueId);
  const project = issue ? getProjectById(issue?.project_id ?? "") : undefined;
  const pageTitle = project && issue ? `${project?.identifier}-${issue?.sequence_id} ${issue?.name}` : undefined;

  if (!issue) return <></>;

  const issueLoader = !issue || isLoading;

  return (
    <>
      <PageHead title={pageTitle} />
      {issueLoader ? (
        <Skeleton aria-label="Loading work item details">
          <div className="flex h-full gap-5 p-5">
            <div className="basis-2/3 space-y-2">
              <SkeletonItem blockSize="30px" inlineSize="40%" />
              <SkeletonItem blockSize="15px" inlineSize="60%" />
              <SkeletonItem blockSize="15px" inlineSize="60%" />
              <SkeletonItem blockSize="15px" inlineSize="40%" />
            </div>
            <div className="basis-1/3 space-y-3">
              <SkeletonItem blockSize="30px" />
              <SkeletonItem blockSize="30px" />
              <SkeletonItem blockSize="30px" />
              <SkeletonItem blockSize="30px" />
            </div>
          </div>
        </Skeleton>
      ) : (
        <>
          <Banner
            variant="warning"
            title="This work item has been archived. Visit the Archives section to restore it."
            icon={<ArchiveOutline className="size-4" />}
            action={
              <Button
                variant="secondary"
                onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/archives/issues/`)}
              >
                Go to archives
              </Button>
            }
            className="border-b border-subtle"
          />
          <div className="flex h-full overflow-hidden">
            <div className="h-full w-full space-y-3 divide-y-2 divide-subtle-1 overflow-y-auto">
              <IssueDetailRoot
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                issueId={archivedIssueId}
                is_archived
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default observer(ArchivedIssueDetailsPage);
