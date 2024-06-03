import { FC } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Crown } from "lucide-react";
import { Button } from "@plane/ui";
// public images
import EstimateEmptyDarkImage from "@/public/empty-state/estimates/dark.svg";
import EstimateEmptyLightImage from "@/public/empty-state/estimates/light.svg";

export const EstimateEEBanner: FC = () => {
  const { resolvedTheme } = useTheme();

  const emptyScreenImage = resolvedTheme === "light" ? EstimateEmptyLightImage : EstimateEmptyDarkImage;

  return (
    <div className="rounded overflow-hidden relative flex items-center mt-10 bg-[linear-gradient(270deg,_#3B5DC5_1.71%,_rgba(44,66,131,0)_111.71%)]">
      <div className="w-full p-10 space-y-2">
        <div className="text-xl font-semibold">Estimate issues better with points</div>
        <div className="text-base text-custom-text-200">
          Use points to estimate scope of work better, monitor capacity, track the burn-down report for your project.
        </div>
        <div className="relative flex items-center gap-4 pt-4">
          <Button prependIcon={<Crown size={12} className="text-amber-400" />} variant="primary" size="sm">
            Upgrade
          </Button>
          <a
            href={"#"}
            target="_blank"
            className="text-base text-custom-primary-100/80 hover:text-custom-primary-100 underline underline-offset-4 transition-colors"
          >
            Talk custom pricing
          </a>
        </div>
      </div>

      <div className="hidden lg:block h-[260px]">
        <Image
          src={emptyScreenImage}
          alt="Empty estimate image"
          width={100}
          height={100}
          className="object-contain w-full h-full"
        />
      </div>
    </div>
  );
};
