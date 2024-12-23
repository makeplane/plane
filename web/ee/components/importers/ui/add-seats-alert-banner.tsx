"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/ui";
// plane web imports
import { UpdateWorkspaceSeatsModal } from "@/plane-web/components/workspace/billing/update-workspace-seats";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type Props = {
  additionalUserCount?: number;
  extraSeatRequired?: number;
};

export const AddSeatsAlertBanner: React.FC<Props> = observer((props: Props) => {
  const { additionalUserCount = 15, extraSeatRequired } = props;
  const [updateWorkspaceSeatsModal, setUpdateWorkspaceSeatsModal] = useState(false);
  const currentWorkspaceSubscriptionAvailableSeats = 12;
  const { togglePaidPlanModal, currentWorkspaceSubscribedPlanDetail: subscribedPlan } = useWorkspaceSubscription();
  const isFreePlan = subscribedPlan?.product == "FREE";

  const toggleUpdateWorkspaceSeatsModal = (flag: boolean) => {
    if (isFreePlan) {
      togglePaidPlanModal(flag);
    } else {
      setUpdateWorkspaceSeatsModal(flag);
    }
  };

  if (currentWorkspaceSubscriptionAvailableSeats && currentWorkspaceSubscriptionAvailableSeats >= additionalUserCount) {
    return <></>;
  }

  const alertMessage = isFreePlan
    ? `You're trying to import ${additionalUserCount} non-registered users and you've only $ ${currentWorkspaceSubscriptionAvailableSeats} seats available in current plan. To continue importing upgrade now.`
    : `You're trying to import ${additionalUserCount} non-registered users and you've only ${currentWorkspaceSubscriptionAvailableSeats} seats available in current plan. To continue importing buy atleast ${extraSeatRequired} extra seats.`;

  return (
    <div className="flex flex-row items-center gap-5 justify-between p-5 bg-red-500/20 rounded">
      <div className="font-normal text-sm">{alertMessage}</div>
      <Button
        variant="primary"
        color="primary"
        onClick={() => {
          toggleUpdateWorkspaceSeatsModal(true);
        }}
      >
        {isFreePlan ? "Upgrade" : "Add Seats"}
      </Button>
      <UpdateWorkspaceSeatsModal
        isOpen={updateWorkspaceSeatsModal}
        variant="ADD_SEATS"
        onClose={() => {
          toggleUpdateWorkspaceSeatsModal(false);
        }}
      />
    </div>
  );
});
