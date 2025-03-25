"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CircleAlert, CircleCheck, RefreshCw } from "lucide-react";
// ui
import { AlertModalCore, Button, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TSelfManagedLicenseActionsProps = {
  showSyncButton?: boolean;
  showDeactivateButton?: boolean;
};

type TLicenseSyncStatus = "synced" | "syncing" | "success" | "error";

export const SelfManagedLicenseActions = observer((props: TSelfManagedLicenseActionsProps) => {
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
  const planName = product && product.charAt(0) + product.slice(1).toLowerCase();

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

  return (
    <>
      {isSelfManaged && (
        <div className="flex w-full items-center px-0.5">
          {showSyncButton && (
            <Button
              variant="link-neutral"
              size="sm"
              className="p-0 py-1 w-20 items-center justify-start underline underline-offset-2"
              onClick={handleSyncLicense}
              disabled={licenseSyncStatus !== "synced"}
            >
              {licenseSyncStatus === "synced" && "Sync plan"}
              {licenseSyncStatus === "syncing" && (
                <>
                  Syncing
                  <RefreshCw size={10} className={cn("flex-shrink-0 mt-0.5 animate-spin")} />
                </>
              )}
              {licenseSyncStatus === "success" && (
                <>
                  Synced
                  <CircleCheck size={10} className="flex-shrink-0 mt-0.5" />
                </>
              )}
              {licenseSyncStatus === "error" && (
                <>
                  Sync error
                  <CircleAlert size={10} className="flex-shrink-0 mt-0.5" />
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
                    All <span className="font-medium">{planName}</span> features will stop working when you do this.
                    Proceed to reactivate this workspace with another license key or downgrade to the Free plan.
                  </>
                }
                secondaryButtonText="Cancel"
                primaryButtonText={{
                  loading: "Delinking",
                  default: "Delink",
                }}
              />
              <Button
                variant="link-danger"
                size="sm"
                className="p-0 py-1 justify-start underline decoration-dashed underline-offset-2"
                onClick={() => setIsDeactivationModalOpen(true)}
              >
                Delink license key
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
});
