import { Bell, BellOff } from "lucide-react";
import { observer } from "mobx-react-lite";
import { FC, useState } from "react";
// UI
import { Button, Loader } from "@plane/ui";
// hooks
import { useIssueDetail } from "hooks/store";
import useToast from "hooks/use-toast";
import isNil from "lodash/isNil";

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

  const isSubscribed = getSubscriptionByIssueId(issueId);

  const handleSubscription = async () => {
    setLoading(true);
    try {
      if (isSubscribed) await removeSubscription(workspaceSlug, projectId, issueId);
      else await createSubscription(workspaceSlug, projectId, issueId);
      setToastAlert({
        type: "success",
        title: `Issue ${isSubscribed ? `unsubscribed` : `subscribed`} successfully.!`,
        message: `Issue ${isSubscribed ? `unsubscribed` : `subscribed`} successfully.!`,
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

  if (isNil(isSubscribed))
    return (
      <Loader>
        <Loader.Item width="106px" height="28px" />
      </Loader>
    );

  return (
    <div>
      <Button
        size="sm"
        prependIcon={isSubscribed ? <BellOff /> : <Bell className="h-3 w-3" />}
        variant="outline-primary"
        className="hover:!bg-custom-primary-100/20"
        onClick={handleSubscription}
      >
        {loading ? (
          <span>
            <span className="hidden sm:block">Loading</span>...
          </span>
        ) : isSubscribed ? (
          <div className="hidden sm:block">Unsubscribe</div>
        ) : (
          <div className="hidden sm:block">Subscribe</div>
        )}
      </Button>
    </div>
  );
});
