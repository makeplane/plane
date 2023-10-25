import { useRouter } from "next/router";
// layouts
import { AppLayout } from "layouts/app-layout";
// contexts
import { IssueViewContextProvider } from "contexts/issue-view.context";
// ui
import { ProjectDraftIssueHeader } from "components/headers";
// icons
import { X, PenSquare } from "lucide-react";
// types
import type { NextPage } from "next";

const ProjectDraftIssues: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  return (
    <IssueViewContextProvider>
      <AppLayout header={<ProjectDraftIssueHeader />} withProjectWrapper>
        <div className="h-full w-full flex flex-col">
          <div className="flex items-center ga-1 px-4 py-2.5 shadow-sm border-b border-custom-border-200">
            <button
              type="button"
              onClick={() => router.push(`/${workspaceSlug}/projects/${projectId}/issues/`)}
              className="flex items-center gap-1.5 rounded border border-custom-border-200 px-3 py-1.5 text-xs"
            >
              <PenSquare className="h-3 w-3 text-custom-text-300" />
              <span>Draft Issues</span>

              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </AppLayout>
    </IssueViewContextProvider>
  );
};

export default ProjectDraftIssues;
