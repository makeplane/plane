import React from "react";
import { AccentureLogo, DolbyLogo, SonyLogo, ZerodhaLogo } from "@plane/propel/icons";

const BRAND_LOGOS: {
  id: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "zerodha",
    icon: <ZerodhaLogo className="h-7 w-24 text-[#387ED1]" />,
  },
  {
    id: "sony",
    icon: <SonyLogo className="h-7 w-16 dark:text-on-color" />,
  },
  {
    id: "dolby",
    icon: <DolbyLogo className="h-7 w-16 dark:text-on-color" />,
  },
  {
    id: "accenture",
    icon: <AccentureLogo className="h-7 w-24 dark:text-on-color" />,
  },
];

export function AuthFooter() {
  return (
    <div className="flex flex-col items-center gap-6">
      <span className="text-13 text-tertiary whitespace-nowrap">Join 10,000+ teams building with Plane</span>
      <div className="flex items-center justify-center gap-x-10 gap-y-4 w-full flex-wrap">
        {BRAND_LOGOS.map((brand) => (
          <div className="flex items-center justify-center h-7 flex-1" key={brand.id}>
            {brand.icon}
          </div>
        ))}
      </div>
    </div>
  );
}
