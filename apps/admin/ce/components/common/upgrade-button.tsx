import React from "react";
// icons
import { SquareArrowOutUpRight } from "lucide-react";
// plane internal packages
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";

export function UpgradeButton() {
  return (
    <a
      href="https://plane.so/pricing?mode=self-hosted"
      target="_blank"
      className={cn(getButtonStyling("primary", "sm"))}
      rel="noreferrer"
    >
      Upgrade
      <SquareArrowOutUpRight className="h-3.5 w-3.5 p-0.5" />
    </a>
  );
}
