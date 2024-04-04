import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Plus, Inbox } from "lucide-react";
import { Button } from "@plane/ui";
// components
import { CreateInboxIssueModal, InboxSidebar, InboxIssueContentRoot } from "@/components/inbox";
import { InboxLayoutLoader } from "@/components/ui";
// hooks
import { useProjectInbox } from "@/hooks/store";

type TInboxIssueRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxIssueId: string | undefined;
  inboxAccessible: boolean;
};

export const InboxIssueRoot: FC<TInboxIssueRoot> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssueId, inboxAccessible } = props;
  // hooks
  const { isLoading, error, fetchInboxIssues, inboxIssuesArray } = useProjectInbox();
  // states
  const [createIssueModal, setCreateIssueModal] = useState(false);

  useSWR(
    inboxAccessible && workspaceSlug && projectId ? `PROJECT_INBOX_ISSUES_${workspaceSlug}_${projectId}` : null,
    () => {
      inboxAccessible && workspaceSlug && projectId && fetchInboxIssues(workspaceSlug.toString(), projectId.toString());
    },
    { revalidateOnFocus: false }
  );

  // loader
  if (isLoading === "init-loading")
    return (
      <div className="relative flex w-full h-full flex-col">
        <InboxLayoutLoader />
      </div>
    );

  // error
  if (error && error?.status === "init-error")
    return (
      <div className="relative w-full h-full flex flex-col gap-3 justify-center items-center">
        <Inbox size={60} strokeWidth={1.5} />
        <div className="text-custom-text-200">{error?.message}</div>
      </div>
    );

  // empty inbox issues
  if (!isLoading && !error && inboxIssuesArray?.length === 0)
    return (
      <div className="relative w-full h-full flex flex-col gap-4 justify-center items-center">
        <div>No issues are available. create a new issue.</div>
        <div>
          <CreateInboxIssueModal isOpen={createIssueModal} onClose={() => setCreateIssueModal(false)} />
          <Button variant="primary" prependIcon={<Plus />} size="sm" onClick={() => setCreateIssueModal(true)}>
            Add Issue
          </Button>
        </div>
      </div>
    );

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      <InboxSidebar workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />
      <InboxIssueContentRoot
        workspaceSlug={workspaceSlug.toString()}
        projectId={projectId.toString()}
        inboxIssueId={inboxIssueId?.toString() || undefined}
        inboxIssuesArrayLength={(inboxIssuesArray || []).length}
      />
    </div>
  );
});
