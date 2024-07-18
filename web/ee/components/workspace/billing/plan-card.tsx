import { FC } from "react";
import { BadgeCheck } from "lucide-react";
// helpers
import { cn } from "@/helpers/common.helper";

type TPlaneCardVariant = "free" | "one" | "pro" | "enterprise";

type TButtonCallToAction = {
  variant: "button";
  label: string;
  onClick: () => void;
};

type TLinkCallToAction = {
  variant: "link";
  label: string;
  url: string;
};

export type TPlanCard = {
  variant: TPlaneCardVariant;
  planName: string;
  isActive: boolean;
  priceDetails: {
    price: string;
    user?: string;
    duration?: string;
  };
  callToAction: TButtonCallToAction | TLinkCallToAction;
  baseFeature?: string;
  features: string[];
};

export const PlanCard: FC<TPlanCard> = (props) => {
  const { planName, isActive, priceDetails, callToAction, baseFeature, features } = props;

  return (
    <div className="py-2 px-4">
      <div className="p-4 border border-custom-border-200 rounded-xl">
        <div className="flex gap-4 items-center justify-between">
          <div className="text-xl font-bold">{planName}</div>
          {isActive && (
            <div className="border-[0.5px] border-custom-primary-100 p-0.5 bg-custom-primary-100/10 text-custom-primary-300 text-xs font-medium rounded">
              Current plan
            </div>
          )}
        </div>
        <div className="flex gap-4 items-center my-4">
          <div className="text-2xl font-semibold">{priceDetails.price}</div>
          <div className="flex flex-col w-full text-xs text-custom-text-300 font-medium">
            <span className="line-clamp-1">{priceDetails.user}</span>
            <span className="line-clamp-2">{priceDetails.duration}</span>
          </div>
        </div>
        <div>
          {callToAction.variant === "button" ? (
            <button
              onClick={callToAction.onClick}
              className={cn(
                "w-full text-center px-4 py-2 text-base font-semibold text-custom-primary-100 bg-custom-background-100 border border-custom-primary-100 rounded-lg"
              )}
            >
              {callToAction.label}
            </button>
          ) : (
            <a
              href={callToAction.url}
              target="_blank"
              className={cn(
                "block w-full text-center px-4 py-2 text-base font-semibold text-custom-primary-100 bg-custom-background-100 border border-custom-primary-100 rounded-lg"
              )}
            >
              {callToAction.label}
            </a>
          )}
        </div>
      </div>
      <div className="py-4">
        <div className="text-sm font-semibold pt-2 h-8">{baseFeature}</div>
        <ul className="text-sm font-medium">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2 items-start py-3 w-full h-12">
              <span className="flex-shrink-0 pt-0.5">
                <BadgeCheck size={14} />
              </span>
              <span className="line-clamp-2">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
