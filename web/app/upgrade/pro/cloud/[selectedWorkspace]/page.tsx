"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Check } from "lucide-react";
// types
import { IPaymentProduct, IPaymentProductPrice } from "@plane/types";
// ui
import { Button, Loader, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// services
import { WorkspaceService } from "@/plane-web/services";
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();
const workspaceService = new WorkspaceService();

const CloudUpgradePlanPage = observer(() => {
  // states
  const [selectedPlan, setSelectedPlan] = useState<IPaymentProductPrice | null>(null);
  const [isLoading, setLoading] = useState(false);
  // router
  const { selectedWorkspace } = useParams();

  // fetch workspace members
  const { data: workspaceMembers, isLoading: isFetching } = useSWR(
    selectedWorkspace ? `WORKSPACES_MEMBER_DETAILS` : null,
    selectedWorkspace ? () => workspaceService.fetchWorkspaceMembers(selectedWorkspace.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch products
  const { data, isLoading: isLoadingProduct } = useSWR(
    selectedWorkspace ? "CLOUD_PAYMENT_PRODUCTS" : null,
    selectedWorkspace ? () => paymentService.listProducts(selectedWorkspace.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  const totalWorkspaceMembers = (workspaceMembers || [])?.filter((member) => member.role >= 15)?.length;

  const proProduct = (data || [])?.find((product: IPaymentProduct) => product?.type === "PRO");

  const monthlyPlan = proProduct?.prices?.find((price) => price.recurring === "month");
  const yearlyPlan = proProduct?.prices?.find((price) => price.recurring === "year");

  const calculateYearlyDiscount = (monthlyAmount: number | undefined, yearlyAmount: number | undefined) => {
    if (!monthlyAmount || !yearlyAmount) return undefined;
    const yearlyCostIfPaidMonthly = monthlyAmount * 12;
    const discountAmount = yearlyCostIfPaidMonthly - yearlyAmount;
    const discountPercentage = (discountAmount / yearlyCostIfPaidMonthly) * 100;

    return discountPercentage;
  };

  const discountedPrice = calculateYearlyDiscount(monthlyPlan?.unit_amount, yearlyPlan?.unit_amount);

  const handleStripeCheckout = (priceId: string) => {
    if (!selectedWorkspace) {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Please select a workspace to continue",
      });
      return;
    }
    setLoading(true);
    paymentService
      .getCurrentWorkspacePaymentLink(selectedWorkspace.toString(), {
        price_id: priceId,
        product_id: proProduct?.id,
      })
      .then((response) => {
        if (response.payment_link) {
          window.open(response.payment_link, "_self");
        }
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.detail ?? "Failed to generate payment link. Please try again.",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <div className="flex flex-col items-center gap-2 pb-4">
        <div className="text-3xl font-semibold">Choose your billing frequency</div>
        {discountedPrice && (
          <div className="text-center text-base text-custom-text-300">{`Upgrade to our yearly plan and get ${Math.round(discountedPrice)}% off.`}</div>
        )}
      </div>

      {isFetching || isLoadingProduct ? (
        <div className="flex flex-col rounded gap-1 w-full">
          <Loader.Item height="90px" />
          <Loader.Item height="90px" />
        </div>
      ) : (
        <div className="flex flex-col rounded w-full">
          {proProduct &&
            proProduct.prices.map((plan) => (
              <div
                key={plan.unit_amount}
                className={cn(
                  "flex items-center justify-between gap-6 border-x border border-custom-border-200 cursor-pointer rounded py-6 px-4 first:rounded-b-none last:rounded-t-none",
                  {
                    "border  border-custom-primary-100": plan.recurring === selectedPlan?.recurring,
                  }
                )}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={cn("flex items-center justify-center size-6 rounded-full", {
                      "bg-custom-primary-100 text-white": plan.recurring === selectedPlan?.recurring,
                      "border border-custom-border-200": plan.recurring !== selectedPlan?.recurring,
                    })}
                  >
                    {plan.recurring === selectedPlan?.recurring && <Check className="size-4 stroke-2" />}
                  </span>
                  <div className="flex flex-col">
                    {totalWorkspaceMembers && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-semibold leading-7">{`$${plan.unit_amount / 100}`}</span>
                        <span className="text-sm text-custom-text-300">
                          {` per user per ${plan.recurring} x ${totalWorkspaceMembers}`}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-custom-text-300">
                      {`Billed ${plan.recurring === "month" ? "monthly" : "yearly"}`}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  {totalWorkspaceMembers && (
                    <span className="text-2xl font-semibold leading-7">{`$${(plan.unit_amount / 100) * totalWorkspaceMembers}`}</span>
                  )}
                  <span className="text-sm text-custom-text-300">
                    {plan.recurring === "month" ? "per month" : "per year"}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
      {selectedPlan?.recurring && selectedPlan.unit_amount ? (
        <>
          <Button className="w-full px-2 my-4" onClick={() => handleStripeCheckout(selectedPlan.id)}>
            {isLoading
              ? "Redirecting to Stripe..."
              : `Pay $${(selectedPlan?.unit_amount / 100) * totalWorkspaceMembers} every ${selectedPlan?.recurring}`}
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

export default CloudUpgradePlanPage;
