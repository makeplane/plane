// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout-legacy";
// ui
import { PrimaryButton } from "components/ui";
// components
import { GlobalViewsHeader } from "components/workspace";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from "lucide-react";

const GlobalViewAssignedIssues: React.FC = () => (
  <WorkspaceAuthorizationLayout
    breadcrumbs={
      <div className="flex gap-2 items-center">
        <CheckCircle className="h-[18px] w-[18px] stroke-[1.5]" />
        <span className="text-sm font-medium">Workspace Issues</span>
      </div>
    }
    right={
      <div className="flex items-center gap-2">
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
    <div className="h-full flex flex-col overflow-hidden bg-custom-background-100">
      <div className="h-full w-full border-b border-custom-border-300">
        <GlobalViewsHeader />
        <div className="h-full w-full flex flex-col">
          {/* TODO: applied filters list */}
          {/* <SpreadsheetView
      spreadsheetIssues={viewIssues}
      mutateIssues={mutateViewIssues}
      handleIssueAction={handleIssueAction}
      disableUserActions={false}
      user={user}
      userAuth={memberRole}
    /> */}
        </div>
      </div>
    </div>
  </WorkspaceAuthorizationLayout>
);

export default GlobalViewAssignedIssues;
