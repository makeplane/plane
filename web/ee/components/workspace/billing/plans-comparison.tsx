import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ArrowDown, ArrowUp, CheckCircle2, LoaderIcon, Minus, MinusCircle } from "lucide-react";
// constants
import { EProductSubscriptionTier } from "@plane/constants";
// types
import { TProductSubscriptionType } from "@plane/types";
// ui
import { Button, Loader } from "@plane/ui";
// constants
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { calculateYearlyDiscount } from "@/plane-web/components/license";
// plane web constants
import { ComingSoonBadge, PLANE_PLANS, TPlanDetail, TPlanePlans, TPlanFeatureData } from "@/plane-web/constants/plans";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TPlansComparisonProps = {
  isProductsAPILoading: boolean;
  trialLoader: boolean;
  upgradeLoader: boolean;
  selectedFrequency: "month" | "year";
  setSelectedFrequency: (frequency: "month" | "year") => void;
  handleTrial: () => void;
  handleUpgrade: (productType: TProductSubscriptionType) => void;
};

const renderPlanData = (data: TPlanFeatureData) => {
  if (data === null || data === undefined) {
    return <Minus className="size-4 text-custom-text-400" />;
  }
  if (data === true) {
    return <CheckCircle2 className="size-4" />;
  }
  if (data === false) {
    return <MinusCircle className="size-4 text-red-500" />;
  }
  return data;
};

export const PlansComparison: FC<TPlansComparisonProps> = observer((props: TPlansComparisonProps) => {
  const {
    isProductsAPILoading,
    trialLoader,
    upgradeLoader,
    selectedFrequency,
    setSelectedFrequency,
    handleTrial,
    handleUpgrade,
  } = props;
  // constants
  const { planDetails, planHighlights, planComparison } = PLANE_PLANS;
  // states
  const [isCompareAllFeaturesSectionOpen, setIsCompareAllFeaturesSectionOpen] = useState(false);
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();
  // derived values
  const isSelfManaged = subscriptionDetail?.is_self_managed;
  const isTrialAllowed = subscriptionDetail?.is_trial_allowed;
  const isOnTrialPeriod = subscriptionDetail?.is_on_trial;
  const isTrialEnded = subscriptionDetail?.is_trial_ended;
  const isTrialDetailVisible = !isSelfManaged && (isTrialAllowed || isOnTrialPeriod || isTrialEnded);

  const shouldRenderPlanDetail = (planKey: TPlanePlans) => {
    switch (planKey) {
      case "one":
        return isSelfManaged;
      default:
        return true;
    }
  };

  const getCurrentPlanKey: () => TPlanePlans | null = () => {
    if (subscriptionDetail?.product === "FREE") {
      return "free";
    }
    if (subscriptionDetail?.product === "ONE") {
      return "one";
    }
    if (subscriptionDetail?.product === "PRO") {
      return "pro";
    }
    return null;
  };

  const handlePlanButtonClick = (planKey: TPlanePlans) => {
    switch (planKey) {
      case "one":
        handleUpgrade("ONE");
        break;
      case "pro":
        handleUpgrade("PRO");
        break;
      case "business":
      case "enterprise":
        window.open("https://plane.so/talk-to-sales", "_blank");
        break;
      default:
        break;
    }
  };

  const renderPopularBadge = (planKey: TPlanePlans) => {
    if (currentPlan === "pro" || planKey !== "pro") return null;
    return <span className="px-2 rounded text-custom-primary-200 bg-custom-primary-100/20 text-xs">Popular</span>;
  };

  const renderPlanButton = (planKey: TPlanePlans, plan: TPlanDetail) => {
    // show current plan button if the current plan is not on trial
    const showCurrentPlanButton = currentPlan === planKey && !isOnTrialPeriod;
    // Intentionally checking for greater than or equal to because we still ned CTA on current plan in case of trial
    const isHigherTierPlan =
      !!subscriptionDetail && EProductSubscriptionTier[plan.id] >= EProductSubscriptionTier[subscriptionDetail.product];
    // Only show the CTA button if it's not the current plan or the current plan is on trial
    const showCTAButton =
      plan.buttonCTA && isHigherTierPlan && (planKey === "pro" && isOnTrialPeriod ? true : currentPlan !== planKey);
    if (!subscriptionDetail) {
      return (
        <Loader className="w-full h-full">
          <Loader.Item height="30px" width="100%" />
        </Loader>
      );
    }
    if (showCurrentPlanButton) {
      return (
        <Button variant="neutral-primary" size="sm" className="w-full" disabled>
          Current plan
        </Button>
      );
    }
    if (showCTAButton) {
      return (
        <Button
          variant={plan.buttonVariant}
          onClick={() => handlePlanButtonClick(planKey)}
          size="sm"
          className="w-full"
          disabled={upgradeLoader}
        >
          {plan.buttonCTA}
        </Button>
      );
    }
    return null;
  };

  const renderProTrialDetails = () => {
    if (isSelfManaged) return null;
    if (isTrialAllowed) {
      return (
        <>
          {!subscriptionDetail || isProductsAPILoading ? (
            <Loader className="w-full h-full pt-1">
              <Loader.Item height="24px" width="100%" />
            </Loader>
          ) : (
            <Button
              variant="link-neutral"
              size="sm"
              onClick={handleTrial}
              className="w-full -mr-3"
              disabled={trialLoader || upgradeLoader}
            >
              <span>Start free trial</span>
              <div className="w-3 h-3">{trialLoader && <LoaderIcon size={12} className="animate-spin" />}</div>
            </Button>
          )}
        </>
      );
    }
    if (isOnTrialPeriod) {
      return (
        <span
          className={cn("w-full py-1 text-center text-custom-text-300 text-xs", {
            "text-red-500": subscriptionDetail.show_trial_banner,
          })}
        >
          Pro trial ends{" "}
          {subscriptionDetail.remaining_trial_days === 0
            ? "today"
            : `in ${subscriptionDetail.remaining_trial_days} days`}
        </span>
      );
    }
    if (isTrialEnded) {
      return <div className="w-full px-2 py-1 text-center text-xs text-red-500 font-medium">Pro trial ended</div>;
    }
    return null;
  };

  const renderPlanFrequencyToggle = ({
    monthlyPriceAmount,
    yearlyPriceAmount,
  }: {
    monthlyPriceAmount?: number;
    yearlyPriceAmount?: number;
  }) => {
    const yearlyDiscount =
      monthlyPriceAmount && yearlyPriceAmount ? calculateYearlyDiscount(monthlyPriceAmount, yearlyPriceAmount) : 0;
    return (
      <>
        {(subscriptionDetail?.show_payment_button || subscriptionDetail?.product === "ONE") && (
          <div className="flex w-full items-center cursor-pointer py-1">
            <div className="flex space-x-1 rounded-md bg-custom-primary-200/10 p-1 w-full">
              <div
                key="month"
                onClick={() => setSelectedFrequency("month")}
                className={cn(
                  "w-full rounded-md px-2 text-xs font-medium leading-5 text-center",
                  selectedFrequency === "month"
                    ? "bg-custom-background-100 text-custom-primary-300 shadow"
                    : "hover:bg-custom-primary-100/5 text-custom-text-300 hover:text-custom-text-200"
                )}
              >
                Monthly
              </div>
              <div
                key="year"
                onClick={() => setSelectedFrequency("year")}
                className={cn(
                  "w-full rounded-md px-2 text-xs font-medium leading-5 text-center",
                  selectedFrequency === "year"
                    ? "bg-custom-background-100 text-custom-primary-300 shadow"
                    : "hover:bg-custom-primary-100/5 text-custom-text-300 hover:text-custom-text-200"
                )}
              >
                Yearly
                {yearlyDiscount > 0 && (
                  <span className="bg-gradient-to-r from-[#C78401] to-[#896828] text-white rounded-full px-1 py-0.5 ml-1 text-[8px]">
                    -{yearlyDiscount}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const currentPlan = getCurrentPlanKey();
  const numberOfPlansToRender = Object.keys(planDetails).filter((planKey) =>
    shouldRenderPlanDetail(planKey as TPlanePlans)
  ).length;

  return (
    <div className="w-full overflow-x-auto horizontal-scrollbar scrollbar-sm px-1">
      <div className="max-w-full p-2" style={{ minWidth: `${numberOfPlansToRender * 240}px` }}>
        <div className="flex flex-col space-y-10">
          <section>
            <div
              className="grid gap-3 text-sm font-medium even:bg-custom-background-90 rounded-sm"
              style={{ gridTemplateColumns: `repeat(${numberOfPlansToRender + 1}, minmax(0, 1fr))` }}
            >
              <div className="col-span-1 p-3 space-y-0.5 text-base font-medium" />
              {Object.entries(planDetails).map(([planKey, plan]) => {
                const currentPlan = planKey as TPlanePlans;
                if (!shouldRenderPlanDetail(currentPlan)) return null;
                // price details
                const price = selectedFrequency === "month" ? plan.monthlyPrice : plan.yearlyPrice;
                const priceDescription =
                  selectedFrequency === "month" ? plan.monthlyPriceDescription : plan.yearlyPriceDescription;
                const priceSecondaryDescription =
                  selectedFrequency === "month"
                    ? plan.monthlyPriceSecondaryDescription
                    : plan.yearlyPriceSecondaryDescription;

                return (
                  <div key={planKey} className="flex flex-col justify-between col-span-1 p-3 space-y-0.5">
                    <div className="flex flex-col items-start">
                      <div className="flex w-full gap-2 items-center text-xl font-medium">
                        <span>{plan.name}</span>
                        {renderPopularBadge(currentPlan)}
                      </div>
                      <div className="flex gap-x-2 items-start text-custom-text-300 pb-1">
                        {price !== undefined && (
                          <span className="text-custom-text-100 text-3xl font-bold">${price}</span>
                        )}
                        <div className="pt-2">
                          {priceDescription && <div>{priceDescription}</div>}
                          {priceSecondaryDescription && (
                            <div className="text-xs text-custom-text-400">{priceSecondaryDescription}</div>
                          )}
                        </div>
                      </div>
                    </div>
                    {subscriptionDetail?.show_payment_button && planKey === "pro" && (
                      <div className="h-8 py-0.5">
                        {renderPlanFrequencyToggle({
                          monthlyPriceAmount: plan.monthlyPrice,
                          yearlyPriceAmount: plan.yearlyPrice,
                        })}
                      </div>
                    )}
                    <div
                      className={cn("flex flex-col gap-1 py-3 items-start", {
                        "h-[70px]": isTrialDetailVisible,
                      })}
                    >
                      {renderPlanButton(currentPlan, plan)}
                      {planKey === "pro" && renderProTrialDetails()}
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              className="grid gap-3 py-1 text-sm text-custom-text-200 even:bg-custom-background-90 rounded-sm"
              style={{ gridTemplateColumns: `repeat(${numberOfPlansToRender + 1}, minmax(0, 1fr))` }}
            >
              <div className="col-span-1 p-3 text-base font-medium">Highlights</div>
              {Object.entries(planHighlights).map(
                ([planKey, highlights]) =>
                  shouldRenderPlanDetail(planKey as TPlanePlans) && (
                    <div key={planKey} className="col-span-1 p-3">
                      <ul className="list-disc space-y-1">
                        {highlights.map((highlight, index) => (
                          <li key={index}>{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  )
              )}
            </div>
          </section>
          {isCompareAllFeaturesSectionOpen && (
            <>
              {planComparison.map((section, sectionIdx) => (
                <section key={sectionIdx}>
                  <h2 className="flex gap-2 items-start text-lg font-semibold text-custom-text-300 mb-2 pl-2">
                    {section.title} {section.comingSoon && <ComingSoonBadge />}
                  </h2>
                  <div className="border-t border-custom-border-200">
                    {section.features.map((feature, featureIdx) => (
                      <div
                        key={featureIdx}
                        className="grid gap-3 text-sm text-custom-text-200 even:bg-custom-background-90 rounded-sm"
                        style={{ gridTemplateColumns: `repeat(${numberOfPlansToRender + 1}, minmax(0, 1fr))` }}
                      >
                        <div className="col-span-1 p-3 flex items-center text-base font-medium">
                          <div className="w-full flex gap-2 items-start justify-between">
                            {feature.title} {feature.comingSoon && <ComingSoonBadge />}
                          </div>
                        </div>
                        {shouldRenderPlanDetail("free") && (
                          <div className="col-span-1 p-3 flex items-center justify-center text-center">
                            {renderPlanData(
                              isSelfManaged ? (feature["self-hosted"]?.free ?? feature.cloud.free) : feature.cloud.free
                            )}
                          </div>
                        )}
                        {shouldRenderPlanDetail("one") && (
                          <div className="col-span-1 p-3 flex items-center justify-center text-center">
                            {renderPlanData(
                              isSelfManaged ? (feature["self-hosted"]?.one ?? feature.cloud.one) : feature.cloud.one
                            )}
                          </div>
                        )}
                        {shouldRenderPlanDetail("pro") && (
                          <div className="col-span-1 p-3 flex items-center justify-center text-center">
                            {renderPlanData(
                              isSelfManaged ? (feature["self-hosted"]?.pro ?? feature.cloud.pro) : feature.cloud.pro
                            )}
                          </div>
                        )}
                        {shouldRenderPlanDetail("business") && (
                          <div className="col-span-1 p-3 flex items-center justify-center text-center">
                            {renderPlanData(
                              isSelfManaged
                                ? (feature["self-hosted"]?.business ?? feature.cloud.business)
                                : feature.cloud.business
                            )}
                          </div>
                        )}
                        {shouldRenderPlanDetail("enterprise") && (
                          <div className="col-span-1 p-3 flex items-center justify-center text-center">
                            {renderPlanData(
                              isSelfManaged
                                ? (feature["self-hosted"]?.enterprise ?? feature.cloud.enterprise)
                                : feature.cloud.enterprise
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-1 my-4">
          <Button
            variant="link-neutral"
            onClick={() => setIsCompareAllFeaturesSectionOpen((prev) => !prev)}
            className="hover:bg-custom-background-90"
          >
            {isCompareAllFeaturesSectionOpen ? "Collapse comparison" : "Compare all features"}
            {isCompareAllFeaturesSectionOpen ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
});
