import { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// mobx
import { useMobxStore } from "lib/mobx/store-provider";
// services
import projectService from "services/project.service";
import inboxService from "services/inbox.service";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// helper
import { truncateText } from "helpers/string.helper";
// components
import { AllViews } from "components/core";
import { AnalyticsProjectModal } from "components/analytics";
import { ProjectIssuesHeader } from "components/headers";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { Plus } from "lucide-react";
// types
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, INBOX_LIST } from "constants/fetch-keys";

const ProjectIssues: NextPage = () => {
  const [analyticsModal, setAnalyticsModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { issueFilter: issueFilterStore, project: projectStore } = useMobxStore();

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  const { data: inboxList } = useSWR(
    workspaceSlug && projectId ? INBOX_LIST(projectId as string) : null,
    workspaceSlug && projectId ? () => inboxService.getInboxes(workspaceSlug as string, projectId as string) : null
  );

  // TODO: update the fetch keys
  useSWR(
    workspaceSlug && projectId ? "REVALIDATE_USER_PROJECT_FILTERS" : null,
    workspaceSlug && projectId
      ? () => issueFilterStore.fetchUserProjectFilters(workspaceSlug.toString(), projectId.toString())
      : null
  );

  useSWR(
    workspaceSlug && projectId ? "REVALIDATE_PROJECT_STATES_LIST" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectStates(workspaceSlug.toString(), projectId.toString())
      : null
  );

  useSWR(
    workspaceSlug && projectId ? "REVALIDATE_PROJECT_LABELS_LIST" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectLabels(workspaceSlug.toString(), projectId.toString())
      : null
  );

  useSWR(
    workspaceSlug && projectId ? "REVALIDATE_PROJECT_MEMBERS_LIST" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectMembers(workspaceSlug.toString(), projectId.toString())
      : null
  );

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${truncateText(projectDetails?.name ?? "Project", 32)} Issues`} />
        </Breadcrumbs>
      }
      right={
        <ProjectIssuesHeader />
        // <div className="flex items-center gap-2">
        //   <SecondaryButton
        //     onClick={() => setAnalyticsModal(true)}
        //     className="!py-1.5 rounded-md font-normal text-custom-sidebar-text-200 border-custom-border-200 hover:text-custom-text-100 hover:bg-custom-sidebar-background-90"
        //     outline
        //   >
        //     Analytics
        //   </SecondaryButton>
        //   {projectDetails && projectDetails.inbox_view && (
        //     <Link href={`/${workspaceSlug}/projects/${projectId}/inbox/${inboxList?.[0]?.id}`}>
        //       <a>
        //         <SecondaryButton
        //           className="relative !py-1.5 rounded-md font-normal text-custom-sidebar-text-200 border-custom-border-200 hover:text-custom-text-100 hover:bg-custom-sidebar-background-90"
        //           outline
        //         >
        //           <span>Inbox</span>
        //           {inboxList && inboxList?.[0]?.pending_issue_count !== 0 && (
        //             <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full text-custom-text-100 bg-custom-sidebar-background-80 border border-custom-sidebar-border-200">
        //               {inboxList?.[0]?.pending_issue_count}
        //             </span>
        //           )}
        //         </SecondaryButton>
        //       </a>
        //     </Link>
        //   )}
        //   <PrimaryButton
        //     className="flex items-center gap-2"
        //     onClick={() => {
        //       const e = new KeyboardEvent("keydown", { key: "c" });
        //       document.dispatchEvent(e);
        //     }}
        //   >
        //     <Plus className="h-4 w-4" />
        //     Add Issue
        //   </PrimaryButton>
        // </div>
      }
      bg="secondary"
    >
      <AnalyticsProjectModal isOpen={analyticsModal} onClose={() => setAnalyticsModal(false)} />
      <div className="h-full w-full flex flex-col">
        <AllViews />
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectIssues;
