import { observer } from "mobx-react";
import Image from "next/image";
// helpers
import { cn } from "@/helpers/common.helper";
// assets
import PlaneLogo from "@/public/plane-logos/blue-without-text.png";
// package.json
import packageJson from "package.json";

export const ProductUpdatesHeader = observer(() => (
  <div className="flex gap-2 mx-6 my-4 items-center justify-between flex-shrink-0">
    <div className="flex w-full items-center">
      <div className="flex gap-2 text-xl font-medium">What&apos;s new</div>
      <div
        className={cn(
          "px-2 mx-2 py-0.5 text-center text-xs font-medium rounded-full bg-custom-primary-100/20 text-custom-primary-100"
        )}
      >
        Version: v{packageJson.version}
      </div>
    </div>
    <div className="flex flex-shrink-0 items-center gap-8">
      <Image src={PlaneLogo} alt="Plane" width={24} height={24} />
    </div>
  </div>
));
