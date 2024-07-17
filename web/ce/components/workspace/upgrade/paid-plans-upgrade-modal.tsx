import { FC } from "react";
// types
import { CircleX } from "lucide-react";
// services
import { EModalWidth, ModalCore } from "@plane/ui";
// plane web components
import { cn } from "@/helpers/common.helper";
// local components
import { OnePlanUpgrade } from "./one-plan-upgrade";
import { ProPlanUpgrade } from "./pro-plan-upgrade";

const PRO_PLAN_FEATURES = [
  "More Cycles features",
  "Full Time Tracking + Bulk Ops",
  "Workflow manager",
  "Automations",
  "Popular integrations",
  "Plane AI",
];

const ONE_PLAN_FEATURES = [
  "OIDC + SAML for SSO",
  "Active Cycles",
  "Real-time collab + public views and page",
  "Link pages in issues and vice-versa",
  "Time-tracking + limited bulk ops",
  "Docker, Kubernetes and more",
];

const FREE_PLAN_UPGRADE_FEATURES = [
  "OIDC + SAML for SSO",
  "Time tracking and bulk ops",
  "Integrations",
  "Public views and pages",
];

export type PaidPlanUpgradeModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const PaidPlanUpgradeModal: FC<PaidPlanUpgradeModalProps> = (props) => {
  const { isOpen, handleClose } = props;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} width={EModalWidth.VIXL} className="rounded-2xl">
      <div className="p-10 max-h-[90vh] overflow-auto">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-4">
            <div className="text-3xl font-bold leading-8 flex">Upgrade to a paid plan and unlock missing features.</div>
            <div className="mt-4 mb-12">
              <p className="text-sm mb-4 pr-8 text-custom-text-100">
                Active Cycles, time tracking, bulk ops, and other features are waiting for you on one of our paid plans.
                Upgrade today to unlock features your teams need yesterday.
              </p>
            </div>
            {/* Free plan details */}
            <div className="py-4 px-2 border border-custom-border-90 rounded-xl">
              <div className="py-2 px-3">
                <span className="px-2 py-1 bg-custom-background-90 text-sm text-custom-text-300 font-medium rounded">
                  Your plan
                </span>
              </div>
              <div className="px-4 py-2 font-semibold">
                <div className="text-3xl">Free</div>
                <div className="text-sm text-custom-text-300">$0 a user per month</div>
              </div>
              <div className="px-2 pt-2 pb-3">
                <ul className="w-full grid grid-cols-12 gap-x-4">
                  {FREE_PLAN_UPGRADE_FEATURES.map((feature) => (
                    <li key={feature} className={cn("col-span-12 relative rounded-md p-2 flex")}>
                      <p className="w-full text-sm font-medium leading-5 flex items-center">
                        <CircleX className="h-4 w-4 mr-4 text-red-500 flex-shrink-0" />
                        <span className="text-custom-text-200 truncate">{feature}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="col-span-12 md:col-span-4">
            <ProPlanUpgrade
              basePlan="One"
              features={PRO_PLAN_FEATURES}
              verticalFeatureList
              extraFeatures={
                <p className="pt-1.5 text-center text-xs text-custom-primary-200 font-semibold underline">
                  <a href="https://plane.so/pro" target="_blank">
                    See full features list
                  </a>
                </p>
              }
            />
          </div>
          <div className="col-span-12 md:col-span-4">
            <OnePlanUpgrade
              features={ONE_PLAN_FEATURES}
              verticalFeatureList
              extraFeatures={
                <p className="pt-1.5 text-center text-xs text-custom-primary-200 font-semibold underline">
                  <a href="https://plane.so/one" target="_blank">
                    See full features list
                  </a>
                </p>
              }
            />
          </div>
        </div>
      </div>
    </ModalCore>
  );
};
