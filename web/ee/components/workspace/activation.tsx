"use client";

import { FC, useState, FormEvent } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { Button, Input, setToast, TOAST_TYPE } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// plane web hooks
import { useSelfHostedSubscription, useWorkspaceSubscription } from "@/plane-web/hooks/store";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";

type TSubscriptionActivation = {
  workspaceSlug: string;
};

export const SubscriptionActivation: FC<TSubscriptionActivation> = observer((props) => {
  const { workspaceSlug } = props;
  // router
  const router = useAppRouter();
  // hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail, handleSuccessModalToggle } =
    useWorkspaceSubscription();
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
      router.push(`/${workspaceSlug}`);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Done!",
        message: subscriptionResponse?.message || "Workspace subscription activated successfully.",
      });
      setTimeout(() => {
        if (subscriptionDetail?.product === "PRO") {
          handleSuccessModalToggle({ isOpen: true, variant: "PRO" });
        } else if (subscriptionDetail?.product === "ONE") {
          handleSuccessModalToggle({ isOpen: true, variant: "ONE" });
        }
      }, 1000);
    } catch (error) {
      const activationError = error as unknown as { response: { data: { error: string } } };
      const errorMessage = activationError?.response?.data?.error || "Something went wrong. Please try again.";
      setErrors(errorMessage);
    } finally {
      setLoader(false);
    }
  };

  return (
    <form className="bg-custom-background-100 rounded-lg py-4 space-y-4" onSubmit={submitActivateLicense}>
      <div className="px-4 space-y-1">
        <h3 className="flex items-center whitespace-nowrap flex-wrap gap-2 text-2xl font-medium">
          Activate
          <div>
            <Image src={PlaneLogo} alt="Plane logo" height="22" width="22" />
          </div>
          Plane Powers
        </h3>
        <p className="text-sm text-custom-text-200">
          The Plane One license key you have will activate this workspace on your instance. Any other workspaces will
          continue to be on the Community Edition.
        </p>
      </div>

      <div className="px-4 space-y-1">
        <label htmlFor="activity-key" className="text-sm text-custom-text-200">
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

      <div className="flex justify-end items-center gap-2 px-4">
        <Button onClick={() => setActivationKey("")} variant="neutral-primary" size="sm">
          Clear
        </Button>
        <Button type="submit" size="sm" disabled={loader}>
          {loader ? "Activating..." : "Activate"}
        </Button>
      </div>
    </form>
  );
});
