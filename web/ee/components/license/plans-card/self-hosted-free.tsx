"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import Link from "next/link";
// ui
import { getButtonStyling} from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web components
import { PlanCard } from "@/plane-web/components/license";

export const SelfHostedFreePlanCard = observer(() => {
  // router
  const { workspaceSlug } = useParams();

  return (
    <PlanCard
      planName="Free"
      planDescription={
        <div className="text-sm font-medium text-custom-text-200">
          Your Plane license can only be used to unlock features for one workspace.
        </div>
      }
      button={
        <Link
          href={`/${workspaceSlug?.toString()}/settings/activation`}
          className={cn(getButtonStyling("primary", "md"), "cursor-pointer outline-none")}
        >
          Activate this workspace
        </Link>
      }
    />
  );
});
