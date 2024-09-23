"use client";

import { FC, useState, FormEvent } from "react";
import { useParams } from "next/navigation";
import { observer } from "mobx-react";
import { Button, EModalWidth, Input, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// components
import { WorkspaceLogo } from "@/components/workspace";
// hooks
import { useWorkspace } from "@/hooks/store";
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
  const { handleSuccessModalToggle } = useWorkspaceSubscription();
  const { activateSubscription } = useSelfHostedSubscription();
  // states
  const [activationKey, setActivationKey] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<string | undefined>(undefined);
  const [loader, setLoader] = useState<boolean>(false);

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
    } catch (error) {
      const activationError = error as unknown as { response: { data: { error: string } } };
      const errorMessage = activationError?.response?.data?.error || "Something went wrong. Please try again.";
      setErrors(errorMessage);
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
              logo={currentWorkspace?.logo}
              name={currentWorkspace?.name}
              classNames="text-lg font-medium h-5 w-5"
            />
            {currentWorkspace?.name}
          </h3>
          <div className="text-sm text-custom-text-300">
            The Plane license key you enter below will activate the associated plan for this workspace on your instance.
            Any other workspaces without a license key will continue to be on the Free plan.
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
            className="w-full"
            autoFocus
          />
          <div className="text-sm text-red-500">{errors}</div>
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
          <Button type="submit" size="sm" disabled={loader}>
            {loader ? "Activating" : "Activate"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
