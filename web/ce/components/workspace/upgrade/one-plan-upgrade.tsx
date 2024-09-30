import { FC } from "react";
import { CheckCircle } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";

export type OnePlanUpgradeProps = {
  features: string[];
  verticalFeatureList?: boolean;
  extraFeatures?: string | React.ReactNode;
};

export const OnePlanUpgrade: FC<OnePlanUpgradeProps> = (props) => {
  const { features, verticalFeatureList = false, extraFeatures } = props;
  // env
  const PLANE_ONE_PAYMENT_URL = "https://prime.plane.so/";

  return (
    <div className="py-4 px-2 border border-custom-border-90 rounded-xl bg-custom-background-90">
      <div className="flex w-full justify-center h-10" />
      <div className="pt-6 pb-4 text-center font-semibold">
        <div className="text-2xl">Plane One</div>
        <div className="text-3xl">$799</div>
        <div className="text-sm text-custom-text-300">for two years’ support and updates</div>
      </div>
      <div className="flex justify-center w-full">
        <a
          href={PLANE_ONE_PAYMENT_URL}
          target="_blank"
          className="relative inline-flex items-center justify-center w-56 px-4 py-2.5 text-white text-sm font-medium border border-[#525252] bg-gradient-to-r from-[#353535] via-[#1111118C] to-[#21212153] rounded-lg focus:outline-none"
        >
          Upgrade to One
        </a>
      </div>
      <div className="px-2 pt-6 pb-2">
        <div className="p-2 text-sm font-semibold">Everything in Free +</div>
        <ul className="w-full grid grid-cols-12 gap-x-4">
          {features.map((feature) => (
            <li
              key={feature}
              className={cn("col-span-12 relative rounded-md p-2 flex", {
                "sm:col-span-6": !verticalFeatureList,
              })}
            >
              <p className="w-full text-sm font-medium leading-5 flex items-center">
                <CheckCircle className="h-4 w-4 mr-4 text-custom-text-300 flex-shrink-0" />
                <span className="text-custom-text-200 truncate">{feature}</span>
              </p>
            </li>
          ))}
        </ul>
        {extraFeatures && <div>{extraFeatures}</div>}
      </div>
    </div>
  );
};
