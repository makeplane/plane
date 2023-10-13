// layouts
<<<<<<< HEAD
import { AppLayout } from "layouts/app-layout";
// components
import { GlobalViewsHeader } from "components/workspace";
import { GlobalIssuesHeader } from "components/headers";
import { GlobalViewLayoutRoot } from "components/issues";
// types
import { NextPage } from "next";

const GlobalViewSubscribedIssues: NextPage = () => (
  <AppLayout header={<GlobalIssuesHeader activeLayout="spreadsheet" />}>
    <div className="h-full overflow-hidden bg-custom-background-100">
      <div className="h-full w-full flex flex-col border-b border-custom-border-300">
        <GlobalViewsHeader />
        <GlobalViewLayoutRoot type="subscribed" />
      </div>
    </div>
  </AppLayout>
);

export default GlobalViewSubscribedIssues;
=======
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { WorkspaceIssuesViewOptions } from "components/issues/workspace-views/workspace-issue-view-option";
import { WorkspaceSubscribedIssues } from "components/issues/workspace-views/workspace-subscribed-issue";
// ui
import { PrimaryButton } from "components/ui";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from "lucide-react";

const WorkspaceViewSubscribedIssue: React.FC = () => (
  <WorkspaceAuthorizationLayout
    breadcrumbs={
      <div className="flex gap-2 items-center">
        <CheckCircle className="h-[18px] w-[18px] stroke-[1.5]" />
        <span className="text-sm font-medium">Workspace Issue</span>
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
    <WorkspaceSubscribedIssues />
  </WorkspaceAuthorizationLayout>
);

export default WorkspaceViewSubscribedIssue;
>>>>>>> c6e021d41fcf8186d9a728dff3347228d1cdb477
