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
import { useParams } from "next/navigation";
import { Loader } from "lucide-react";
// plane imports
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { EProductSubscriptionEnum } from "@plane/types";
import { cn } from "@plane/utils";
// plane web imports
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

export type TTrialButtonProps = {
  handleClose: () => void;
  priceId: string | undefined;
  productId: string | undefined;
  variant: EProductSubscriptionEnum;
};

export function TrialButton(props: TTrialButtonProps) {
  const { handleClose, productId, priceId, variant } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [trialLoader, setTrialLoader] = useState<boolean>(false);
  // hooks
  const { freeTrialSubscription, handleSuccessModalToggle } = useWorkspaceSubscription();

  const handleTrial = async () => {
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
      const currentError = error as { error: string; detail: string };
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
      className="text-center text-body-xs-medium text-tertiary hover:text-primary transition-all flex justify-center items-center gap-1.5 -ml-5"
      onClick={handleTrial}
    >
      <div className="relative w-3 h-3">
        {trialLoader && <Loader size={12} className={cn("absolute inset-0 animate-spin")} />}
      </div>
      <span className="transition-all duration-300">Start free trial</span>
    </button>
  );
}
