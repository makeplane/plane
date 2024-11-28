"use client";

import React from "react";
// icons
import { SquareArrowOutUpRight } from "lucide-react";
// ui
import { getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

export const UpgradeButton: React.FC = () => (
  <a href="https://plane.so/pricing?mode=self-hosted" target="_blank" className={cn(getButtonStyling("primary", "sm"))}>
    Upgrade
    <SquareArrowOutUpRight className="h-3.5 w-3.5 p-0.5" />
  </a>
);
