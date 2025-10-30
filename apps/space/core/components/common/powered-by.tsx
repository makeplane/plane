"use client";

import type { FC } from "react";
import { WEBSITE_URL } from "@plane/constants";
// assets
import { PlaneLogo } from "@plane/propel/icons";

type TPoweredBy = {
  disabled?: boolean;
};

export const PoweredBy: FC<TPoweredBy> = (props) => {
  // props
  const { disabled = false } = props;

  if (disabled || !WEBSITE_URL) return null;

  return (
    <a
      href={WEBSITE_URL}
      className="fixed bottom-2.5 right-5 !z-[999999] flex items-center gap-1 rounded border border-custom-border-200 bg-custom-background-100 px-2 py-1 shadow-custom-shadow-2xs"
      target="_blank"
      rel="noreferrer noopener"
    >
      <PlaneLogo className="h-3 w-auto text-custom-text-100" />
      <div className="text-xs">
        Powered by <span className="font-semibold">Plane Publish</span>
      </div>
    </a>
  );
};
