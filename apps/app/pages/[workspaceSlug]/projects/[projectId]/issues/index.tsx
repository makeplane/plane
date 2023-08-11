import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectService from "services/project.service";
import inboxService from "services/inbox.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// helper
import { truncateText } from "helpers/string.helper";
// components
import { IssuesFilterView, IssuesView } from "components/core";
import { AnalyticsProjectModal } from "components/analytics";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// types
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, INBOX_LIST } from "constants/fetch-keys";

const ProjectIssues: NextPage = () => {
  const [analyticsModal, setAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: inboxList } = useSWR(
    workspaceSlug && projectId ? INBOX_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => inboxService.getInboxes(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <IssueViewContextProvider>
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
            <BreadcrumbItem
              title={`${truncateText(projectDetails?.name ?? "Project", 32)} Issues`}
            />
          </Breadcrumbs>
        }
        right={
          <div className="flex items-center gap-2">
            <IssuesFilterView />
            <SecondaryButton
              onClick={() => setAnalyticsModal(true)}
              className="!py-1.5 rounded-md font-normal text-custom-sidebar-text-200 border-custom-border-200 hover:text-custom-text-100 hover:bg-custom-sidebar-background-90"
              outline
            >
              Analytics
            </SecondaryButton>
            {projectDetails && projectDetails.inbox_view && (
              <Link href={`/${workspaceSlug}/projects/${projectId}/inbox/${inboxList?.[0]?.id}`}>
                <a>
                  <SecondaryButton
                    className="relative !py-1.5 rounded-md font-normal text-custom-sidebar-text-200 border-custom-border-200 hover:text-custom-text-100 hover:bg-custom-sidebar-background-90"
                    outline
                  >
                    <span>Inbox</span>
                    {inboxList && inboxList?.[0]?.pending_issue_count !== 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-custom-text-100 bg-custom-sidebar-background-80 border border-custom-sidebar-border-200">
                        {inboxList?.[0]?.pending_issue_count}
                      </span>
                    )}
                  </SecondaryButton>
                </a>
              </Link>
            )}
            <PrimaryButton
              className="flex items-center gap-2"
              onClick={() => {
                const e = new KeyboardEvent("keydown", { key: "c" });
                document.dispatchEvent(e);
              }}
            >
              <PlusIcon className="h-4 w-4" />
              Add Issue
            </PrimaryButton>
          </div>
        }
        bg="secondary"
      >
        <AnalyticsProjectModal isOpen={analyticsModal} onClose={() => setAnalyticsModal(false)} />
        <div className="h-full w-full flex flex-col">
          <IssuesView />
        </div>
      </ProjectAuthorizationWrapper>
    </IssueViewContextProvider>
  );
};

export default ProjectIssues;
