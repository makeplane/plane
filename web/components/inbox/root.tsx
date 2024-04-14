import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Inbox } from "lucide-react";
// components
import { EmptyState } from "@/components/empty-state";
import { InboxSidebar, InboxContentRoot } from "@/components/inbox";
import { InboxLayoutLoader } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
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
  const { loader, error, fetchInboxIssues } = useProjectInbox();

  useSWR(
    inboxAccessible && workspaceSlug && projectId ? `PROJECT_INBOX_ISSUES_${workspaceSlug}_${projectId}` : null,
    async () => {
      inboxAccessible &&
        workspaceSlug &&
        projectId &&
        (await fetchInboxIssues(workspaceSlug.toString(), projectId.toString()));
    },
    { revalidateOnFocus: false, revalidateIfStale: false }
  );

  // loader
  if (loader === "init-loading")
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

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      <InboxSidebar workspaceSlug={workspaceSlug.toString()} projectId={projectId.toString()} />

      {inboxIssueId ? (
        <InboxContentRoot
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          inboxIssueId={inboxIssueId.toString()}
        />
      ) : (
        <div className="w-full h-full relative flex justify-center items-center">
          <EmptyState type={EmptyStateType.INBOX_DETAIL_EMPTY_STATE} layout="screen-simple" />
        </div>
      )}
    </div>
  );
});
