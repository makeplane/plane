import { FC, useState } from "react";
import { Bell } from "lucide-react";
import { observer } from "mobx-react-lite";
// UI
import { Button } from "@plane/ui";
// hooks
import { useIssueDetail } from "hooks/store";
import useToast from "hooks/use-toast";

export type TIssueSubscription = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

export const IssueSubscription: FC<TIssueSubscription> = observer((props) => {
  const { workspaceSlug, projectId, issueId } = props;
  // hooks
  const {
    subscription: { getSubscriptionByIssueId },
    createSubscription,
    removeSubscription,
  } = useIssueDetail();
  const { setToastAlert } = useToast();
  // state
  const [loading, setLoading] = useState(false);

  const subscription = getSubscriptionByIssueId(issueId);

  const handleSubscription = async () => {
    setLoading(true);
    try {
      if (subscription?.subscribed) await removeSubscription(workspaceSlug, projectId, issueId);
      else await createSubscription(workspaceSlug, projectId, issueId);
      setToastAlert({
        type: "success",
        title: `Issue ${subscription?.subscribed ? `unsubscribed` : `subscribed`} successfully.!`,
        message: `Issue ${subscription?.subscribed ? `unsubscribed` : `subscribed`} successfully.!`,
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setToastAlert({
        type: "error",
        title: "Error",
        message: "Something went wrong. Please try again later.",
      });
    }
  };

  return (
    <div>
      <Button
        size="sm"
        prependIcon={<Bell className="h-3 w-3" />}
        variant="outline-primary"
        className="hover:!bg-custom-primary-100/20"
        onClick={handleSubscription}
      >
        {loading ? "Loading..." : subscription?.subscribed ? "Unsubscribe" : "Subscribe"}
      </Button>
    </div>
  );
});
