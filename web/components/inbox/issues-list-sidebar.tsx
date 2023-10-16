import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";

// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { InboxIssueCard, InboxFiltersList } from "components/inbox";
// ui
import { Loader } from "@plane/ui";

export const InboxIssuesListSidebar = observer(() => {
  const router = useRouter();
  const { inboxId, inboxIssueId } = router.query;

  const { inboxIssues: inboxIssuesStore } = useMobxStore();

  const issuesList = inboxId ? inboxIssuesStore.inboxIssues[inboxId.toString()] : undefined;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <InboxFiltersList />
      {issuesList ? (
        issuesList.length > 0 ? (
          <div className="divide-y divide-custom-border-200 overflow-auto h-full">
            {issuesList.map((issue) => (
              <InboxIssueCard key={issue.id} active={issue.issue_inbox[0].id === inboxIssueId} issue={issue} />
            ))}
          </div>
        ) : (
          <div className="h-full p-4 grid place-items-center text-center text-sm text-custom-text-200">
            {/* TODO: add filtersLength logic here */}
            {/* {filtersLength > 0 && "No issues found for the selected filters. Try changing the filters."} */}
          </div>
        )
      ) : (
        <Loader className="p-4 space-y-4">
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
          <Loader.Item height="50px" />
        </Loader>
      )}
    </div>
  );
});
