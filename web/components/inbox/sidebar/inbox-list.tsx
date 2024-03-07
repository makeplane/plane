import { FC, useRef } from "react";
import { observer } from "mobx-react";
// types
import { TInboxIssue } from "@plane/types";
// hooks
import { useIntersectionObserver } from "hooks/use-intersection-observer";
// components
import { InboxIssueListItem } from "components/inbox";

export type InboxIssueListProps = {
  workspaceSlug: string;
  projectId: string;
  projectIdentifier: string;
  inboxIssues: TInboxIssue[];
};

export const InboxIssueList: FC<InboxIssueListProps> = observer((props) => {
  const { workspaceSlug, projectId, inboxIssues, projectIdentifier } = props;
  // ref
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  // hooks
  useIntersectionObserver(containerRef, observerRef, () => {
    console.log("loading more");
  });

  return (
    <div className="overflow-y-auto w-full h-full vertical-scrollbar scrollbar-md" ref={containerRef}>
      {inboxIssues.map((inboxIssue) => (
        <InboxIssueListItem
          key={inboxIssue.id}
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          projectIdentifier={projectIdentifier}
          inboxIssue={inboxIssue}
        />
      ))}
      <div ref={observerRef}>Loading...</div>
    </div>
  );
});
