import { FC } from "react";
import { Inbox } from "lucide-react";
import { observer } from "mobx-react";
// hooks
import { useInboxIssues } from "hooks/store";
// ui
import { InboxSidebarLoader } from "components/ui";
// components
import { InboxIssueList, InboxIssueFilterSelection, InboxIssueAppliedFilter } from "../";

type TInboxSidebarRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
};

export const InboxSidebarRoot: FC<TInboxSidebarRoot> = observer((props) => {
  const { workspaceSlug, projectId, inboxId } = props;
  // store hooks
  const {
    issues: { loader },
  } = useInboxIssues();

  if (loader === "init-loader") {
    return <InboxSidebarLoader />;
  }

  return (
    <div className="relative flex flex-col w-full h-full">
      <div className="flex-shrink-0 w-full h-[50px] relative flex justify-between items-center gap-2 p-2 px-3 border-b border-custom-border-300">
        <div className="relative flex items-center gap-1">
          <div className="relative w-6 h-6 flex justify-center items-center rounded bg-custom-background-80">
            <Inbox className="w-4 h-4" />
          </div>
        </div>
        <div className="z-20">
          <InboxIssueFilterSelection workspaceSlug={workspaceSlug} projectId={projectId} inboxId={inboxId} />
        </div>
      </div>

      <div className="w-full h-auto">
        <InboxIssueAppliedFilter workspaceSlug={workspaceSlug} projectId={projectId} inboxId={inboxId} />
      </div>

      <div className="w-full h-full overflow-hidden">
        <InboxIssueList workspaceSlug={workspaceSlug} projectId={projectId} inboxId={inboxId} />
      </div>
    </div>
  );
});
