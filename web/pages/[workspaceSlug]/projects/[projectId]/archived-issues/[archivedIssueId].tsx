import React, { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// react-hook-form
import { useForm } from "react-hook-form";
// services
import { IssueService, IssueArchiveService } from "services/issue";
// hooks
import useUserAuth from "hooks/use-user-auth";
import useToast from "hooks/use-toast";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// components
import { IssueDetailsSidebar, IssueMainContent } from "components/issues";
// ui
import { Icon } from "components/ui";
import { Breadcrumbs } from "components/breadcrumbs";
import { Loader } from "@plane/ui";
// types
import { IIssue } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_ISSUES_ACTIVITY, ISSUE_DETAILS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

const defaultValues: Partial<IIssue> = {
  name: "",
  description: "",
  description_html: "",
  estimate_point: null,
  state: "",
  assignees_list: [],
  priority: "low",
  target_date: new Date().toString(),
  issue_cycle: null,
  issue_module: null,
  labels_list: [],
};

// services
const issueService = new IssueService();
const issueArchiveService = new IssueArchiveService();

const ArchivedIssueDetailsPage: NextPage = () => {
  const [isRestoring, setIsRestoring] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, archivedIssueId } = router.query;

  const { user } = useUserAuth();
  const { setToastAlert } = useToast();

  const { data: issueDetails, mutate: mutateIssueDetails } = useSWR<IIssue | undefined>(
    workspaceSlug && projectId && archivedIssueId ? ISSUE_DETAILS(archivedIssueId as string) : null,
    workspaceSlug && projectId && archivedIssueId
      ? () =>
          issueArchiveService.retrieveArchivedIssue(
            workspaceSlug as string,
            projectId as string,
            archivedIssueId as string
          )
      : null
  );

  const { reset, control, watch } = useForm<IIssue>({
    defaultValues,
  });

  const submitChanges = useCallback(
    async (formData: Partial<IIssue>) => {
      if (!workspaceSlug || !projectId || !archivedIssueId) return;

      mutate<IIssue>(
        ISSUE_DETAILS(archivedIssueId as string),
        (prevData) => {
          if (!prevData) return prevData;

          return {
            ...prevData,
            ...formData,
          };
        },
        false
      );

      const payload: Partial<IIssue> = {
        ...formData,
      };

      await issueService
        .patchIssue(workspaceSlug as string, projectId as string, archivedIssueId as string, payload, user)
        .then(() => {
          mutateIssueDetails();
          mutate(PROJECT_ISSUES_ACTIVITY(archivedIssueId as string));
        })
        .catch((e) => {
          console.error(e);
        });
    },
    [workspaceSlug, archivedIssueId, projectId, mutateIssueDetails, user]
  );

  useEffect(() => {
    if (!issueDetails) return;

    mutate(PROJECT_ISSUES_ACTIVITY(archivedIssueId as string));
    reset({
      ...issueDetails,
      assignees_list: issueDetails.assignees_list ?? issueDetails.assignee_details?.map((user) => user.id),
      labels_list: issueDetails.labels_list ?? issueDetails.labels,
      labels: issueDetails.labels_list ?? issueDetails.labels,
    });
  }, [issueDetails, reset, archivedIssueId]);

  const handleUnArchive = async () => {
    if (!workspaceSlug || !projectId || !archivedIssueId) return;

    setIsRestoring(true);

    await issueArchiveService
      .unarchiveIssue(workspaceSlug as string, projectId as string, archivedIssueId as string)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success",
          message: `${issueDetails?.project_detail?.identifier}-${issueDetails?.sequence_id} is restored successfully under the project ${issueDetails?.project_detail?.name}`,
        });
        router.push(`/${workspaceSlug}/projects/${projectId}/issues/${archivedIssueId}`);
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      })
      .finally(() => setIsRestoring(false));
  };

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            title={`${truncateText(issueDetails?.project_detail.name ?? "Project", 32)} Issues`}
            link={`/${workspaceSlug}/projects/${projectId as string}/issues`}
            linkTruncate
          />
          <Breadcrumbs.BreadcrumbItem
            title={`Issue ${issueDetails?.project_detail.identifier ?? "Project"}-${
              issueDetails?.sequence_id ?? "..."
            } Details`}
            unshrinkTitle
          />
        </Breadcrumbs>
      }
    >
      {issueDetails && projectId ? (
        <div className="flex h-full overflow-hidden">
          <div className="w-2/3 h-full overflow-y-auto space-y-2 divide-y-2 divide-custom-border-300 p-5">
            {issueDetails.archived_at && (
              <div className="flex items-center justify-between gap-2 px-2.5 py-2 text-sm border rounded-md text-custom-text-200 border-custom-border-200 bg-custom-background-90">
                <div className="flex gap-2 items-center">
                  <Icon iconName="archive" className="" />
                  <p>This issue has been archived by Plane.</p>
                </div>
                <button
                  className="flex items-center gap-2 p-1.5 text-sm rounded-md border border-custom-border-200"
                  onClick={handleUnArchive}
                  disabled={isRestoring}
                >
                  <Icon iconName="history" />
                  <span>{isRestoring ? "Restoring..." : "Restore Issue"}</span>
                </button>
              </div>
            )}
            <div className="space-y-5 divide-y-2 divide-custom-border-200 opacity-60 pointer-events-none">
              <IssueMainContent issueDetails={issueDetails} submitChanges={submitChanges} uneditable />
            </div>
          </div>
          <div className="w-1/3 h-full space-y-5 border-l border-custom-border-300 p-5 overflow-hidden">
            <IssueDetailsSidebar
              control={control}
              issueDetail={issueDetails}
              submitChanges={submitChanges}
              watch={watch}
              uneditable
            />
          </div>
        </div>
      ) : (
        <Loader className="flex h-full gap-5 p-5">
          <div className="basis-2/3 space-y-2">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="40%" />
          </div>
          <div className="basis-1/3 space-y-3">
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
          </div>
        </Loader>
      )}
    </ProjectAuthorizationWrapper>
  );
};

export default ArchivedIssueDetailsPage;
