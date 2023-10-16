import { useRouter } from "next/router";

// hooks
import useInboxView from "hooks/use-inbox-view";
// components
import { InboxIssueCard, InboxFiltersList } from "components/inbox";
// ui
import { Loader } from "@plane/ui";

export const IssuesListSidebar = () => {
  const router = useRouter();
  const { inboxIssueId } = router.query;

  const { issues: inboxIssues, filtersLength } = useInboxView();

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <InboxFiltersList />
      {inboxIssues ? (
        inboxIssues.length > 0 ? (
          <div className="divide-y divide-custom-border-200 overflow-auto h-full">
            {inboxIssues.map((issue: any) => (
              <InboxIssueCard key={issue.id} active={issue.bridge_id === inboxIssueId} issue={issue} />
            ))}
          </div>
        ) : (
          <div className="h-full p-4 grid place-items-center text-center text-sm text-custom-text-200">
            {filtersLength > 0 && "No issues found for the selected filters. Try changing the filters."}
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
};
