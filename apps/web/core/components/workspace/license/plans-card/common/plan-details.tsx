/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// plane imports
import { renderFormattedDate } from "@plane/utils";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const PlanDetails = observer(function PlanDetails() {
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

  // derived values
  const totalSeats = subscriptionDetail?.purchased_seats ?? 0;
  const occupiedSeats = subscriptionDetail?.occupied_seats ?? 0;
  const unUsedSeats = totalSeats - occupiedSeats;
  const startDate = subscriptionDetail?.current_period_start_date;
  const endDate = subscriptionDetail?.current_period_end_date;
  const isCancelled = subscriptionDetail?.is_cancelled;
  const offlinePayment = subscriptionDetail?.is_offline_payment;

  const fields = [
    {
      label: "Total seats",
      value: <span className="text-nowrap text-body-sm-medium">{totalSeats}</span>,
    },
    {
      label: "Unused seats",
      value: <span className="text-nowrap text-body-sm-medium">{unUsedSeats}</span>,
    },
    {
      label: startDate || isCancelled ? "Billing period" : "Next invoice",
      value: (
        <span className="text-nowrap text-body-xs-medium">
          {offlinePayment && !endDate ? (
            <a className="text-accent-primary hover:underline" href="mailto:support@plane.so">
              Contact support
            </a>
          ) : (
            <>
              {startDate && !isCancelled && renderFormattedDate(startDate)}
              {endDate && (
                <span className="text-body-xs-regular text-secondary">
                  {isCancelled ? " Ends on " : startDate ? " to " : " Renews on "}
                </span>
              )}
              {renderFormattedDate(endDate) || "--"}
            </>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-layer-1 rounded-b-lg border border-t-0 border-subtle">
      <div className="overflow-x-auto flex justify-between gap-3 p-4 max-w-4xl">
        {fields.map((field, index) => (
          <div key={index} className="flex flex-col gap-2">
            <span className="text-nowrap text-caption-md-medium text-tertiary">{field.label}</span>
            {field.value}
          </div>
        ))}
      </div>
    </div>
  );
});
