import { FC, useState } from "react";
import { Bell } from "lucide-react";
import { observer } from "mobx-react-lite";
// UI
import { Button } from "@plane/ui";
// hooks
import { useIssueDetail } from "hooks/store";

export type TIssueSubscription = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  currentUserId: string;
  disabled?: boolean;
};

export const IssueSubscription: FC<TIssueSubscription> = observer((props) => {
  const { workspaceSlug, projectId, issueId, currentUserId, disabled } = props;
  // hooks
  const {
    issue: { getIssueById },
    subscription: { getSubscriptionByIssueId },
    createSubscription,
    removeSubscription,
  } = useIssueDetail();
  // state
  const [loading, setLoading] = useState(false);

  const issue = getIssueById(issueId);
  const subscription = getSubscriptionByIssueId(issueId);

  const handleSubscription = () => {
    setLoading(true);
    if (subscription?.subscribed) removeSubscription(workspaceSlug, projectId, issueId);
    else createSubscription(workspaceSlug, projectId, issueId);
  };

  if (issue?.created_by === currentUserId || issue?.assignee_ids.includes(currentUserId)) return <></>;

  return (
    <div>
      <Button
        size="sm"
        prependIcon={<Bell className="h-3 w-3" />}
        variant="outline-primary"
        className="hover:!bg-custom-primary-100/20"
        onClick={handleSubscription}
        disabled={disabled}
      >
        {loading ? "Loading..." : subscription?.subscribed ? "Unsubscribe" : "Subscribe"}
      </Button>
    </div>
  );
});
