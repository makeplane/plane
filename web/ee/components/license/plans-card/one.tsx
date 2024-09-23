"use client";

import { observer } from "mobx-react";
import { ExternalLink } from "lucide-react";
// ui
import { getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// assets
import { PlanCard } from "@/plane-web/components/license";

export const OnePlanCard: React.FC = observer(() => (
  <PlanCard
    planName="One"
    planDescription="Active cycles, Time Tracking, Public View + Pages, ~50 Members"
    button={
      <a
        href="https://prime.plane.so/"
        target="_blank"
        className={cn(
          getButtonStyling("neutral-primary", "md"),
          "cursor-pointer rounded-2xl px-3 py-1.5 text-center text-sm font-medium outline-none"
        )}
      >
        {"Manage your license"}
        <ExternalLink className="h-3 w-3" strokeWidth={2} />
      </a>
    }
  />
));
