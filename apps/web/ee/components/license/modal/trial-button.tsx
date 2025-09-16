"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
// plane imports
import { Loader } from "lucide-react";
import { LICENSE_TRACKER_ELEMENTS, LICENSE_TRACKER_EVENTS } from "@plane/constants";
import { EProductSubscriptionEnum } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export type TTrialButtonProps = {
  handleClose: () => void;
  priceId: string | undefined;
  productId: string | undefined;
  variant: EProductSubscriptionEnum;
};

export const TrialButton: React.FC<TTrialButtonProps> = (props: TTrialButtonProps) => {
  const { handleClose, productId, priceId, variant } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [trialLoader, setTrialLoader] = useState<boolean>(false);
  // hooks
  const { freeTrialSubscription, handleSuccessModalToggle } = useWorkspaceSubscription();

  const handleTrial = async (productId: string | undefined, priceId: string | undefined) => {
    if (!productId || !priceId) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Unable to get the product id or price id. Please try again.",
      });
      return;
    }
    try {
      setTrialLoader(true);
      if (!workspaceSlug) return;
      await freeTrialSubscription(workspaceSlug.toString(), { product_id: productId, price_id: priceId });
      handleClose();
      handleSuccessModalToggle(true);
      captureSuccess({
        eventName: LICENSE_TRACKER_EVENTS.trial_started,
        payload: {
          plan: variant,
        },
      });
    } catch (error) {
      const currentError = error as unknown as { error: string; detail: string };
      console.error("Error in freeTrialSubscription", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: currentError?.detail ?? currentError?.error ?? "Something went wrong. Please try again.",
      });
      captureError({
        eventName: LICENSE_TRACKER_EVENTS.trial_started,
        payload: {
          plan: variant,
        },
      });
    } finally {
      setTrialLoader(false);
    }
  };

  return (
    <button
      data-element={LICENSE_TRACKER_ELEMENTS.MODAL_TRIAL_BUTTON}
      disabled={trialLoader}
      className="text-center text-sm text-custom-text-300 hover:text-custom-text-100 font-medium transition-all flex justify-center items-center gap-1.5 -ml-5"
      onClick={() => handleTrial(productId, priceId)}
    >
      <div className="relative w-3 h-3">
        {trialLoader && <Loader size={12} className={cn("absolute inset-0 animate-spin")} />}
      </div>
      <span className="transition-all duration-300">Start free trial</span>
    </button>
  );
};
