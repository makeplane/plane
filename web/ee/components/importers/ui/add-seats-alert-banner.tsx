"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// plane web imports
import { AddSeatsModal } from "@/plane-web/components/workspace/billing/manage-seats/add-seats/modal";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type Props = {
  additionalUserCount?: number;
  extraSeatRequired?: number;
};

export const AddSeatsAlertBanner: React.FC<Props> = observer((props: Props) => {
  const { additionalUserCount = 15, extraSeatRequired } = props;
  const [addWorkspaceSeatsModal, setUpdateWorkspaceSeatsModal] = useState(false);
  const {
    togglePaidPlanModal,
    currentWorkspaceSubscribedPlanDetail: subscribedPlan,
    currentWorkspaceSubscriptionAvailableSeats,
  } = useWorkspaceSubscription();
  const isFreePlan = subscribedPlan?.product === EProductSubscriptionEnum.FREE;

  const { t } = useTranslation();

  const toggleAddWorkspaceSeatsModal = (flag: boolean) => {
    if (isFreePlan) {
      togglePaidPlanModal(flag);
    } else {
      setUpdateWorkspaceSeatsModal(flag);
    }
  };

  if (currentWorkspaceSubscriptionAvailableSeats && currentWorkspaceSubscriptionAvailableSeats >= additionalUserCount) {
    return <></>;
  }

  const addSeatMessagePaid = t("importers.add_seat_msg_paid", {
    additionalUserCount: additionalUserCount?.toString(),
    currentWorkspaceSubscriptionAvailableSeats: currentWorkspaceSubscriptionAvailableSeats?.toString(),
    extraSeatRequired: extraSeatRequired?.toString(),
  });
  const addSeatMessageFree = t("importers.add_seat_msg_free_trial", {
    additionalUserCount: additionalUserCount?.toString(),
    currentWorkspaceSubscriptionAvailableSeats: currentWorkspaceSubscriptionAvailableSeats?.toString(),
  });

  const alertMessage = isFreePlan ? addSeatMessageFree : addSeatMessagePaid;

  return (
    <div className="flex flex-row items-center gap-5 justify-between p-5 bg-red-500/20 rounded">
      <div className="font-normal text-sm">{alertMessage}</div>
      <Button
        variant="primary"
        color="primary"
        onClick={() => {
          toggleAddWorkspaceSeatsModal(true);
        }}
      >
        {isFreePlan ? t("common.upgrade") : t("common.add_seats")}
      </Button>
      <AddSeatsModal
        data={{
          isOpen: addWorkspaceSeatsModal,
        }}
        onClose={() => {
          toggleAddWorkspaceSeatsModal(false);
        }}
      />
    </div>
  );
});
