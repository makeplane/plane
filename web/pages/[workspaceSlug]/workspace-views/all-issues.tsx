// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// component
import { Button } from "@plane/ui";
import { WorkspaceIssuesViewOptions } from "components/issues/workspace-views/workspace-issue-view-option";
import { WorkspaceAllIssue } from "components/issues/workspace-views/workspace-all-issue";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
import { CheckCircle } from "lucide-react";

const WorkspaceViewAllIssue = () => (
  <WorkspaceAuthorizationLayout
    breadcrumbs={
      <div className="flex gap-2 items-center">
        <CheckCircle className="h-[18px] w-[18px] stroke-[1.5]" />
        <span className="text-sm font-medium">Workspace issues</span>
      </div>
    }
    right={
      <div className="flex items-center gap-2">
        <WorkspaceIssuesViewOptions />

        <Button
          variant="primary"
          prependIcon={<PlusIcon />}
          onClick={() => {
            const e = new KeyboardEvent("keydown", { key: "c" });
            document.dispatchEvent(e);
          }}
        >
          Add Issue
        </Button>
      </div>
    }
  >
    <WorkspaceAllIssue />
  </WorkspaceAuthorizationLayout>
);

export default WorkspaceViewAllIssue;
