import { observer } from "mobx-react";
import { ArrowDown, ArrowUp } from "lucide-react";
// plane imports
import { Button } from "@plane/ui";
import { cn } from "@plane/utils";
// constants
import { ComingSoonBadge, PLANE_PLANS, PLANS_LIST, TPlanePlans } from "@/constants/plans";
// local imports
import { PlanFeatureDetail } from "./feature-detail";

type TPlansComparisonBaseProps = {
  planeDetails: React.ReactNode;
  isSelfManaged: boolean;
  isCompareAllFeaturesSectionOpen: boolean;
  setIsCompareAllFeaturesSectionOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const shouldRenderPlanDetail = (planKey: TPlanePlans) => {
  // Free plan is not required to be shown in the comparison
  if (planKey === "free") return false;
  // Plane one plan is not longer available
  if (planKey === "one") return false;
  return true;
};

export const PlansComparisonBase = observer((props: TPlansComparisonBaseProps) => {
  const { planeDetails, isSelfManaged, isCompareAllFeaturesSectionOpen, setIsCompareAllFeaturesSectionOpen } = props;
  // plan details
  const { planDetails, planHighlights, planComparison } = PLANE_PLANS;
  const numberOfPlansToRender = Object.keys(planDetails).filter((planKey) =>
    shouldRenderPlanDetail(planKey as TPlanePlans)
  ).length;

  const getSubscriptionType = (planKey: TPlanePlans) => planDetails[planKey].id;

  return (
    <div
      className={`size-full px-2 overflow-x-auto horizontal-scrollbar scrollbar-sm transition-all duration-500 ease-out will-change-transform`}
    >
      <div className="max-w-full" style={{ minWidth: `${numberOfPlansToRender * 280}px` }}>
        <div className="h-full flex flex-col gap-y-10">
          <div
            className={cn(
              "flex-shrink-0 sticky top-2 z-10 bg-custom-background-100 grid gap-3 text-sm font-medium even:bg-custom-background-90 transition-all duration-500 ease-out will-change-transform"
            )}
            style={{
              gridTemplateColumns: `repeat(${numberOfPlansToRender + 1}, minmax(0, 1fr))`,
            }}
          >
            <div className="col-span-1 p-3 space-y-0.5 text-base font-medium" />
            {planeDetails}
          </div>
          {/* Plan Headers */}
          <section className="flex-shrink-0">
            {/* Plan Highlights */}
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

          {/* Feature Comparison */}
          {isCompareAllFeaturesSectionOpen && (
            <>
              {planComparison.map((section, sectionIdx) => (
                <section key={sectionIdx} className="flex-shrink-0">
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
                        {PLANS_LIST.map(
                          (planKey) =>
                            shouldRenderPlanDetail(planKey) && (
                              <div
                                key={planKey}
                                className="col-span-1 p-3 flex items-center justify-center text-center"
                              >
                                <PlanFeatureDetail
                                  subscriptionType={getSubscriptionType(planKey)}
                                  data={
                                    isSelfManaged
                                      ? (feature["self-hosted"]?.[planKey] ?? feature.cloud[planKey])
                                      : feature.cloud[planKey]
                                  }
                                />
                              </div>
                            )
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </>
          )}
        </div>

        {/* Toggle Button */}
        <div className="flex items-center justify-center gap-1 my-4 pb-2">
          <Button
            variant="link-neutral"
            onClick={() => {
              setIsCompareAllFeaturesSectionOpen(!isCompareAllFeaturesSectionOpen);
            }}
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
