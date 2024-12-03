"use client";

import { FC } from "react";
import Image from "next/image";
import { WEBSITE_URL } from "@plane/constants";
// assets
import planeLogo from "@/public/plane-logo.svg";

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
      <div className="relative grid h-6 w-6 place-items-center">
        <Image src={planeLogo} alt="Plane logo" className="h-6 w-6" height="24" width="24" />
      </div>
      <div className="text-xs">
        Powered by <span className="font-semibold">Plane Publish</span>
      </div>
    </a>
  );
};
