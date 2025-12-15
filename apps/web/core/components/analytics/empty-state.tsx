import { useTheme } from "next-themes";
// plane package imports
import { cn } from "@plane/utils";
// assets
import darkBackgroundAsset from "@/app/assets/empty-state/analytics/empty-grid-background-dark.webp?url";
import lightBackgroundAsset from "@/app/assets/empty-state/analytics/empty-grid-background-light.webp?url";

type Props = {
  title: string;
  description?: string;
  assetPath?: string;
  className?: string;
};

function AnalyticsEmptyState({ title, description, assetPath, className }: Props) {
  // theme hook
  const { resolvedTheme } = useTheme();
  const backgroundReolvedPath = resolvedTheme === "light" ? lightBackgroundAsset : darkBackgroundAsset;

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center overflow-y-auto rounded-lg border border-subtle px-5 py-10 md:px-20",
        className
      )}
    >
      <div className={cn("flex flex-col items-center")}>
        {assetPath && (
          <div className="relative flex max-h-[200px] max-w-[200px] items-center justify-center">
            <img src={assetPath} alt={title} className="z-10 h-2/3 w-2/3 object-contain" />
            <div className="absolute inset-0">
              <img src={backgroundReolvedPath} alt={title} className="h-full w-full object-contain" />
            </div>
          </div>
        )}
        <div className="flex flex-shrink flex-col items-center gap-1.5 text-center">
          <h3 className={cn("text-18 font-semibold")}>{title}</h3>
          {description && <p className="text-13 text-tertiary max-w-[350px]">{description}</p>}
        </div>
      </div>
    </div>
  );
}

export default AnalyticsEmptyState;
