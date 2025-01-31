"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/ui";
// plane web imports
import { UpdateWorkspaceSeatsModal } from "@/plane-web/components/workspace/billing/update-workspace-seats";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { useTranslation } from "@plane/i18n";

type Props = {
  additionalUserCount?: number;
  extraSeatRequired?: number;
};

export const AddSeatsAlertBanner: React.FC<Props> = observer((props: Props) => {
  const { additionalUserCount = 15, extraSeatRequired } = props;
  const [updateWorkspaceSeatsModal, setUpdateWorkspaceSeatsModal] = useState(false);
  const { togglePaidPlanModal, currentWorkspaceSubscribedPlanDetail: subscribedPlan, currentWorkspaceSubscriptionAvailableSeats } = useWorkspaceSubscription();
  const isFreePlan = subscribedPlan?.product == "FREE";

  const { t } = useTranslation()

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

  const addSeatMessagePaid = t("importers.add_seat_msg_paid", {"additionalUserCount": additionalUserCount?.toString(), "currentWorkspaceSubscriptionAvailableSeats": currentWorkspaceSubscriptionAvailableSeats?.toString(), "extraSeatRequired": extraSeatRequired?.toString()});
  const addSeatMessageFree = t("importers.add_seat_msg_free_trial", {"additionalUserCount": additionalUserCount?.toString(), "currentWorkspaceSubscriptionAvailableSeats": currentWorkspaceSubscriptionAvailableSeats?.toString()});

  const alertMessage = isFreePlan
    ? addSeatMessageFree
    : addSeatMessagePaid;

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
        {isFreePlan ? t("common.upgrade") : t("common.add_seats")}
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
