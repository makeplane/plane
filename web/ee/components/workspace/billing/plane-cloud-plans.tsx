import { FC } from "react";
import { observer } from "mobx-react";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
// plane web components
import { PlanCard, TPlanCard } from "@/plane-web/components/workspace/billing";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

const freePlanFeatures = [
  "Unlimited projects",
  "Unlimited issues",
  "Cycles and Modules",
  "Layouts + Views",
  "Pages",
  "Intake",
];

const onePlanFeatures = [
  "OIDC and SAML",
  "Active Cycles",
  "Real-time collab",
  "Limited time tracking",
  "Linked pages",
  "Docker, Kubernetes + more",
];

const proPlanFeatures = [
  "Active Cycles + other Cycles features",
  "Bulk ops",
  "Time tracking",
  "Customizable dashboards",
  "On-demand reports",
  "Shared and public views",
];

const enterprisePlanFeatures = [
  "Unlimited Issues",
  "Unlimited file upload",
  "Priority support",
  "Custom Theming",
  "Access to Roadmap",
  "Plane AI",
];

export const PlaneCloudPlans: FC = observer(() => {
  // hooks
  const { sidebarCollapsed } = useAppTheme();
  const { togglePaidPlanModal } = useWorkspaceSubscription();

  const planePlans: TPlanCard[] = [
    {
      variant: "free",
      planName: "Free",
      isActive: true,
      priceDetails: {
        price: "$0",
        user: "per user",
        duration: "per month",
      },
      callToAction: {
        variant: "link",
        label: "Start for free",
        url: "https://plane.so/pricing",
      },
      features: freePlanFeatures,
    },
    {
      variant: "one",
      planName: "One",
      isActive: false,
      priceDetails: {
        price: "$799",
        user: "100 users",
        duration: "Two years' support",
      },
      callToAction: {
        variant: "link",
        label: "Get One",
        url: "https://plane.so/one",
      },
      baseFeature: "Everything in Free +",
      features: onePlanFeatures,
    },
    {
      variant: "pro",
      planName: "Pro",
      isActive: false,
      priceDetails: {
        price: "$7",
        user: "per user",
        duration: "per month",
      },
      callToAction: {
        variant: "button",
        label: "Get Pro",
        onClick: () => togglePaidPlanModal(true),
      },
      baseFeature: "Everything in One +",
      features: proPlanFeatures,
    },
    {
      variant: "enterprise",
      planName: "Enterprise",
      isActive: false,
      priceDetails: {
        price: "Custom",
      },
      callToAction: {
        variant: "link",
        label: "Talk to Sales",
        url: "https://plane.so/contact",
      },
      baseFeature: "Everything in Pro +",
      features: enterprisePlanFeatures,
    },
  ];

  return (
    <div className="grid grid-cols-12 w-full py-8">
      {planePlans.map((plan) => (
        <div
          key={plan.variant}
          className={cn("col-span-12 sm:col-span-6 md:col-span-12 lg:col-span-6", {
            "lg:col-span-6 xl:col-span-3": sidebarCollapsed,
            "lg:col-span-12 xl:col-span-3": !sidebarCollapsed,
          })}
        >
          <PlanCard
            variant={plan.variant}
            planName={plan.planName}
            isActive={plan.isActive}
            priceDetails={plan.priceDetails}
            callToAction={plan.callToAction}
            baseFeature={plan.baseFeature}
            features={plan.features}
          />
        </div>
      ))}
    </div>
  );
});
