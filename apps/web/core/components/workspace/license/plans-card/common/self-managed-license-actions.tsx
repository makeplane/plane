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

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CircleAlert, CircleCheck, RefreshCw } from "lucide-react";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
// plane imports
import { AlertModalCore } from "@plane/ui";
import { cn, getSubscriptionName } from "@plane/utils";
// hooks
import { useSelfHostedSubscription } from "@/plane-web/hooks/store/use-self-hosted-subscription";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store/use-workspace-subscription";

type TSelfManagedLicenseActionsProps = {
  showSyncButton?: boolean;
  showDeactivateButton?: boolean;
};

type TLicenseSyncStatus = "synced" | "syncing" | "success" | "error";

export const SelfManagedLicenseActions = observer(function SelfManagedLicenseActions(
  props: TSelfManagedLicenseActionsProps
) {
  const { showSyncButton = true, showDeactivateButton = true } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [licenseSyncStatus, setLicenseSyncStatus] = useState<TLicenseSyncStatus>("synced");
  const [isDeactivationModalOpen, setIsDeactivationModalOpen] = useState<boolean>(false);
  const [isDeactivating, setIsDeactivating] = useState<boolean>(false);
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  const { syncLicense, deactivateLicense } = useSelfHostedSubscription();
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;
  const product = subscriptionDetail?.product;
  const planName = product && getSubscriptionName(product);

  const handleSyncLicense = () => {
    setLicenseSyncStatus("syncing");
    syncLicense(workspaceSlug.toString())
      .then(() => {
        setLicenseSyncStatus("success");
      })
      .catch(() => {
        setLicenseSyncStatus("error");
      })
      .finally(() => {
        setTimeout(() => {
          setLicenseSyncStatus("synced");
        }, 3000);
      });
  };

  const handleDeactivation = () => {
    setIsDeactivating(true);
    deactivateLicense(workspaceSlug.toString())
      .then(() => {
        setIsDeactivationModalOpen(false);
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success",
          message: "License deactivated successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Failed to deactivate license. Please try again.",
        });
      })
      .finally(() => {
        setIsDeactivating(false);
      });
  };

  if (!isSelfManaged) return null;
  return (
    <div className="flex w-full items-center pt-3 gap-2">
      {showSyncButton && (
        <Button variant="secondary" onClick={handleSyncLicense} disabled={licenseSyncStatus !== "synced"}>
          {licenseSyncStatus === "synced" && "Sync plan"}
          {licenseSyncStatus === "syncing" && (
            <>
              <RefreshCw size={10} className={cn("flex-shrink-0 mt-0.5 animate-spin transition-all duration-700")} />
              Syncing
            </>
          )}
          {licenseSyncStatus === "success" && (
            <>
              <CircleCheck
                size={10}
                className="flex-shrink-0 mt-0.5 transition-all duration-300 animate-in zoom-in-50"
              />
              Synced
            </>
          )}
          {licenseSyncStatus === "error" && (
            <>
              <CircleAlert
                size={10}
                className="flex-shrink-0 mt-0.5 transition-all duration-300 animate-in zoom-in-50"
              />
              Sync error
            </>
          )}
        </Button>
      )}
      {showDeactivateButton && (
        <>
          <AlertModalCore
            handleClose={() => setIsDeactivationModalOpen(false)}
            handleSubmit={handleDeactivation}
            isSubmitting={isDeactivating}
            isOpen={isDeactivationModalOpen}
            title="Delink license key"
            content={
              <>
                All <span className="font-medium">{planName}</span> features will stop working when you do this. Proceed
                to reactivate this workspace with another license key or downgrade to the Free plan.
              </>
            }
            secondaryButtonText="Cancel"
            primaryButtonText={{
              loading: "Delinking",
              default: "Delink",
            }}
          />
          <Button variant="error-outline" onClick={() => setIsDeactivationModalOpen(true)}>
            Delink license key
          </Button>
        </>
      )}
    </div>
  );
});
