"use client";

import { observer } from "mobx-react";
import { ExternalLink } from "lucide-react";
// plane imports
import { EProductSubscriptionEnum } from "@plane/constants";
import { getButtonStyling } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// plane web components
import { PlanCard, SelfManagedLicenseActions } from "@/plane-web/components/license";

export const OnePlanCard: React.FC = observer(() => (
  <PlanCard
    planVariant={EProductSubscriptionEnum.ONE}
    planDescription={
      <>
        <div>Active cycles, Time Tracking, Public View + Pages, ~50 Members</div>
        <SelfManagedLicenseActions />
      </>
    }
    button={
      <>
        <a
          href="https://prime.plane.so/"
          target="_blank"
          className={cn(
            getButtonStyling("primary", "md"),
            "cursor-pointer px-3 py-1.5 text-center text-sm font-medium outline-none"
          )}
        >
          {"Manage your license"}
          <ExternalLink className="h-3 w-3" strokeWidth={2} />
        </a>
      </>
    }
  />
));
