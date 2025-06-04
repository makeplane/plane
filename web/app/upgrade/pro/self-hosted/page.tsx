"use client";

import React, { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";
// ui
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";

type TSelfHostedProduct = {
  recurring: "month" | "year";
  unit_amount: number;
  redirection_link: string | undefined;
};

const selfHostedProducts: TSelfHostedProduct[] = [
  {
    recurring: "month",
    unit_amount: 8,
    redirection_link: process.env.NEXT_PUBLIC_PRO_SELF_HOSTED_MONTHLY_PAYMENT_URL || undefined,
  },
  {
    recurring: "year",
    unit_amount: 72,
    redirection_link: process.env.NEXT_PUBLIC_PRO_SELF_HOSTED_PAYMENT_URL || undefined,
  },
];

const SelfHostedUpgradePlanPage = observer(() => {
  // router
  const router = useAppRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // states
  const [selectedPlan, setSelectedPlan] = useState<TSelfHostedProduct | undefined>(undefined);

  useEffect(() => {
    const planDetail = searchParams.get("plan");
    if (planDetail === "month") {
      router.replace(pathname, {}, { showProgressBar: false });
      setSelectedPlan(selfHostedProducts.find((product) => product.recurring === "month"));
    } else if (planDetail === "year") {
      router.replace(pathname, {}, { showProgressBar: false });
      setSelectedPlan(selfHostedProducts.find((product) => product.recurring === "year"));
    }
  }, [pathname, router, searchParams]);

  const handleStripeRedirection = () => {
    if (selectedPlan?.redirection_link) {
      window.open(selectedPlan.redirection_link, "_blank");
    } else {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to generate payment link.",
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <div className="flex flex-col items-center gap-2 pb-4">
        <div className="text-3xl font-semibold">Choose your billing frequency</div>
        <div className="text-center text-base text-custom-text-300">Upgrade to our yearly plan and get 25% off.</div>
      </div>
      <div className="flex flex-col rounded w-full">
        {selfHostedProducts &&
          selfHostedProducts.map((product) => (
            <div
              key={product.unit_amount}
              className={cn(
                "flex items-center gap-6 border-x border border-custom-border-200 cursor-pointer rounded py-6 px-4 first:rounded-b-none last:rounded-t-none",
                {
                  "border  border-custom-primary-100": product.recurring === selectedPlan?.recurring,
                }
              )}
              onClick={() => setSelectedPlan(product)}
            >
              <div className="flex items-center gap-4">
                <span
                  className={cn("flex items-center justify-center size-6 rounded-full", {
                    "bg-custom-primary-100 text-white": product.recurring === selectedPlan?.recurring,
                    "border border-custom-border-200": product.recurring !== selectedPlan?.recurring,
                  })}
                >
                  {product.recurring === selectedPlan?.recurring && <Check className="size-4 stroke-2" />}
                </span>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-semibold leading-7">${product.unit_amount}</span>
                    <span className="text-sm text-custom-text-300">{` per user per ${product.recurring}`}</span>
                  </div>
                  <span className="text-sm text-custom-text-300">
                    {`Billed ${product.recurring === "month" ? "monthly" : "yearly"}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>
      {selectedPlan?.recurring && selectedPlan.unit_amount ? (
        <>
          <Button className="w-full px-2 my-4" onClick={handleStripeRedirection}>
            {`Pay $${selectedPlan.unit_amount}  every ${selectedPlan?.recurring}`}
          </Button>
        </>
      ) : (
        <>
          <Button className="w-full px-2 my-4" disabled>{`Select a plan to continue`}</Button>
        </>
      )}
    </div>
  );
});

export default SelfHostedUpgradePlanPage;
