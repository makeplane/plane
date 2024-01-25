import { FC } from "react";
import { observer } from "mobx-react";
import { Inbox } from "lucide-react";
// hooks
import { useInboxIssues } from "hooks/store";
// components
import { InboxIssueActionsHeader } from "components/inbox";
import { InboxIssueDetailRoot } from "components/issues/issue-detail/inbox";
// ui
import { Loader } from "@plane/ui";

type TInboxContentRoot = {
  workspaceSlug: string;
  projectId: string;
  inboxId: string;
  inboxIssueId: string | undefined;
};

export const InboxContentRoot: FC<TInboxContentRoot> = observer((props) => {
  const { workspaceSlug, projectId, inboxId, inboxIssueId } = props;
  // hooks
  const {
    issues: { loader, getInboxIssuesByInboxId },
  } = useInboxIssues();

  const inboxIssuesList = inboxId ? getInboxIssuesByInboxId(inboxId) : undefined;

  return (
    <>
      {loader === "init-loader" ? (
        <Loader className="flex h-full gap-5 p-5">
          <div className="basis-2/3 space-y-2">
            <Loader.Item height="30px" width="40%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="60%" />
            <Loader.Item height="15px" width="40%" />
          </div>
          <div className="basis-1/3 space-y-3">
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
            <Loader.Item height="30px" />
          </div>
        </Loader>
      ) : (
        <>
          {!inboxIssueId ? (
            <div className="grid h-full place-items-center p-4 text-custom-text-200">
              <div className="grid h-full place-items-center">
                <div className="my-5 flex flex-col items-center gap-4">
                  <Inbox size={60} strokeWidth={1.5} />
                  {inboxIssuesList && inboxIssuesList.length > 0 ? (
                    <span className="text-custom-text-200">
                      {inboxIssuesList?.length} issues found. Select an issue from the sidebar to view its details.
                    </span>
                  ) : (
                    <span className="text-custom-text-200">No issues found</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full overflow-hidden relative flex flex-col">
              <div className="flex-shrink-0 min-h-[50px] border-b border-custom-border-300">
                <InboxIssueActionsHeader
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  inboxId={inboxId}
                  inboxIssueId={inboxIssueId}
                />
              </div>
              <div className="w-full h-full">
                <InboxIssueDetailRoot
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  inboxId={inboxId}
                  issueId={inboxIssueId}
                />
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
});
