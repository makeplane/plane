import { useCallback, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// hook
// import useToast from "hooks/use-toast";
import useProjects from "hooks/use-projects";
import useUser from "hooks/use-user";
import useWorkspaceMembers from "hooks/use-workspace-members";
// context
import { useProjectMyMembership } from "contexts/project-member.context";
// services
import projectIssuesServices from "services/issues.service";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { FiltersList, SpreadsheetView } from "components/core";
import { WorkspaceViewsNavigation } from "components/workspace/views/workpace-view-navigation";
import { WorkspaceIssuesViewOptions } from "components/issues/workspace-views/workspace-issue-view-option";
import { CreateUpdateViewModal } from "components/views";
import { CreateUpdateIssueModal, DeleteIssueModal } from "components/issues";
// ui
import { EmptyState, PrimaryButton } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from "lucide-react";
// images
// fetch-keys
import { WORKSPACE_LABELS, WORKSPACE_VIEW_ISSUES } from "constants/fetch-keys";
// constant
import { STATE_GROUP } from "constants/project";
// types
import { IIssue, IWorkspaceIssueFilterOptions } from "types";
import workspaceService from "services/workspace.service";
import { useWorkspaceView } from "hooks/use-workspace-issues-view";
import { WorkspaceViewProvider } from "contexts/workspace-view-context";
import { WorkspaceViewIssues } from "components/issues/workspace-views/workpace-view-issues";

const WorkspaceView: React.FC = () => (
  <WorkspaceAuthorizationLayout
    breadcrumbs={
      <div className="flex gap-2 items-center">
        <CheckCircle className="h-[18px] w-[18px] stroke-[1.5]" />
        <span className="text-sm font-medium">
          {/* {view ? `${view.name} Issues` : "Workspace Issues"} */}
          issues
        </span>
      </div>
    }
    right={
      <div className="flex items-center gap-2">
        <WorkspaceIssuesViewOptions />
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
  >
    <WorkspaceViewProvider>
      <WorkspaceViewIssues />
    </WorkspaceViewProvider>
  </WorkspaceAuthorizationLayout>
);

export default WorkspaceView;
