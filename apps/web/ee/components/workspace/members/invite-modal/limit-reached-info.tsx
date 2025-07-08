import { observer } from "mobx-react";
import { Info } from "lucide-react";
// plane imports
import { Button, getButtonStyling, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TInvitationLimitReactInfoProps = {
  handleAddMoreSeats: () => void;
};

export const InvitationLimitReactInfo = observer((props: TInvitationLimitReactInfoProps) => {
  const { handleAddMoreSeats } = props;
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isOfflineSubscription = subscriptionDetail?.is_offline_payment;

  return (
    <div className="flex gap-1.5 py-2 px-3 rounded bg-custom-background-90 text-xs text-custom-text-200">
      <div className="flex-shirk-0">
        <Info className="size-3 mt-0.5" />
      </div>
      <div>
        <p className="font-medium">You are out of seats for this workspace.</p>
        <p className="pt-1">
          You have hit the member limit for this workspace. To add more admins and members to this workspace, please
          remove members or add more seats.
        </p>
      </div>
      <div className="flex-shirk-0 flex items-end pl-2">
        {isOfflineSubscription ? (
          <Tooltip
            tooltipContent="You have an offline subscription. Please contact support to add more seats."
            position="right"
          >
            <a href="mailto:support@plane.so" className={cn(getButtonStyling("primary", "sm"), "py-1 px-2")}>
              Contact support
            </a>
          </Tooltip>
        ) : (
          <Button variant="primary" size="sm" className="py-1 px-2" onClick={handleAddMoreSeats}>
            Add more seats
          </Button>
        )}
      </div>
    </div>
  );
});
