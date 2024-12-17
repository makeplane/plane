"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
// ui
import { Loader } from "lucide-react";
import { setToast, TOAST_TYPE } from "@plane/ui";
// plane web components
import { TTrialButtonProps } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export const ProTrialButton: React.FC<TTrialButtonProps> = (props: TTrialButtonProps) => {
  const { productId, priceId, handleClose } = props;
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
    } catch (error) {
      const currentError = error as unknown as { error: string; detail: string };
      console.error("Error in freeTrialSubscription", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: currentError?.detail ?? currentError?.error ?? "Something went wrong. Please try again.",
      });
    } finally {
      setTrialLoader(false);
    }
  };

  return (
    <button
      disabled={trialLoader}
      className="mt-4 text-center text-sm text-custom-text-300 hover:text-custom-text-100 font-medium transition-all flex justify-center items-center gap-2"
      onClick={() => handleTrial(productId, priceId)}
    >
      <span>Start free trial</span>
      <div className="w-3 h-3">{trialLoader && <Loader size={12} className="animate-spin" />}</div>
    </button>
  );
};
