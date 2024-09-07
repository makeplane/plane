import Image from "next/image";
import { ExternalLink } from "lucide-react";
// ui
import { getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// assets
import PlaneOneLogo from "@/public/plane-logos/plane-one.svg";

export const PlaneOneBilling: React.FC = () => (
  <div>
    <div className="flex gap-2 text-lg font-medium justify-between">
      <div className="flex items-center gap-2">
        <Image src={PlaneOneLogo} alt="Plane One" width={36} height={36} />
        <h4 className="text-2xl mb-1 leading-6 font-bold"> Plane One</h4>
        <div className="text-center text-sm text-custom-text-200 font-medium">(Perpetual license: 1)</div>
      </div>
      <div>
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
      </div>
    </div>
  </div>
);
