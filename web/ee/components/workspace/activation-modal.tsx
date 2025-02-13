"use client";

import { FC, useState, FormEvent } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { Button, EModalWidth, Input, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { WorkspaceLogo } from "@/components/workspace";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { getFileURL } from "@/helpers/file.helper";
import { useUserPermissions, useWorkspace } from "@/hooks/store";
// plane web hooks
import { useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TSubscriptionActivationModal = {
  isOpen: boolean;
  handleClose: () => void;
};

export const SubscriptionActivationModal: FC<TSubscriptionActivationModal> = observer((props) => {
  const { isOpen, handleClose } = props;
  // router
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // hooks
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  const { handleSuccessModalToggle } = useWorkspaceSubscription();
  const { activateSubscription } = useSelfHostedSubscription();
  // states
  const [activationKey, setActivationKey] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<string | undefined>(undefined);
  const [loader, setLoader] = useState<boolean>(false);
  // derived values
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN], EUserPermissionsLevel.WORKSPACE, workspaceSlug);

  const handleActivateLicense = async (event: FormEvent<HTMLInputElement>) => {
    setErrors(undefined);
    setActivationKey(event.currentTarget.value);
  };

  const submitActivateLicense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspaceSlug) return;

    if (!activationKey || activationKey.length <= 0) {
      setErrors("Please enter a valid license key");
      return;
    }

    try {
      setLoader(true);
      const subscriptionResponse = await activateSubscription(workspaceSlug, activationKey);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: subscriptionResponse?.message || "Workspace subscription activated successfully.",
      });
      handleClose();
      handleSuccessModalToggle(true);
    } catch {
      setErrors("Your license is invalid or already in use. For any queries contact support@plane.so");
    } finally {
      setLoader(false);
    }
  };

  if (!workspaceSlug) {
    setToast({
      type: TOAST_TYPE.ERROR,
      title: "Error!",
      message: "Workspace slug is not defined. Please try again.",
    });
    return null;
  }

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.XXXL} className="rounded-xl">
      <form className="p-4 bg-custom-background-100 rounded-lg space-y-4" onSubmit={submitActivateLicense}>
        <div className="space-y-1.5">
          <h3 className="flex items-center whitespace-nowrap flex-wrap gap-2 text-xl font-medium">
            Activate
            <WorkspaceLogo
              logo={getFileURL(currentWorkspace?.logo_url ?? "")}
              name={currentWorkspace?.name}
              classNames="text-lg font-medium h-5 w-5"
            />
            {currentWorkspace?.name}
          </h3>
          <div className="text-sm text-custom-text-300">
            Enter a license key to activate the plan you subscribed to on this workspace. Any other workspaces without a
            license key on this instance will continue to be on the Free plan.
          </div>
        </div>
        <div>
          <label htmlFor="activity-key" className="text-sm font-medium text-custom-text-200 px-0.5">
            Enter license key
          </label>
          <Input
            id="activity-key"
            type="text"
            name="activity-key"
            placeholder="qwweq-wewqw-weqweq"
            value={activationKey}
            onChange={handleActivateLicense}
            hasError={(errors && Boolean(errors)) || false}
            className={cn("w-full", !isAdmin && "cursor-not-allowed")}
            disabled={!isAdmin}
            autoFocus
          />
          <div className="text-sm text-red-500">{errors}</div>
        </div>
        <div className="flex justify-between gap-2">
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <div className="text-xs text-red-500 cursor-help">
                You don&apos;t have permission to perform this action. Please contact the workspace admin.
              </div>
            )}
          </div>
          <div className="flex justify-end items-center gap-2">
            <Button
              onClick={() => {
                handleClose();
                setActivationKey("");
                setErrors(undefined);
              }}
              variant="neutral-primary"
              size="sm"
            >
              Close
            </Button>
            <Button type="submit" size="sm" disabled={loader || !isAdmin}>
              {loader ? "Activating" : "Activate"}
            </Button>
          </div>
        </div>
      </form>
    </ModalCore>
  );
});
