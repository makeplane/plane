import React from "react";
import Image from "next/image";
// plane package imports
import { cn } from "@plane/utils";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

type Props = {
  title: string;
  description?: string;
  assetPath?: string;
  className?: string;
};

const AnalyticsEmptyState = ({ title, description, assetPath, className }: Props) => {
  const backgroundReolvedPath = useResolvedAssetPath({ basePath: "/empty-state/analytics/empty-grid-background" });

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-y-auto rounded-lg border border-custom-border-100 px-5 py-10 md:px-20",
        className
      )}
    >
      <div className={cn("flex flex-col items-center")}>
        {assetPath && (
          <div className="relative flex max-h-[200px] max-w-[200px] items-center justify-center">
            <Image src={assetPath} alt={title} width={100} height={100} layout="fixed" className="z-10 h-2/3 w-2/3" />
            <div className="absolute inset-0">
              <Image
                src={backgroundReolvedPath}
                alt={title}
                width={100}
                height={100}
                layout="fixed"
                className="h-full w-full"
              />
            </div>
          </div>
        )}
        <div className="flex flex-shrink flex-col items-center gap-1.5 text-center">
          <h3 className={cn("text-xl font-semibold")}>{title}</h3>
          {description && <p className="text-sm text-custom-text-300 max-w-[350px]">{description}</p>}
        </div>
      </div>
    </div>
  );
};
export default AnalyticsEmptyState;
