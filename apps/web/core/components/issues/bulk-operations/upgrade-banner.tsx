import { MARKETING_PLANE_ONE_PAGE_LINK } from "@plane/constants";
import { getButtonStyling } from "@plane/propel/button";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
};

export function BulkOperationsUpgradeBanner(props: Props) {
  const { className } = props;

  return (
    <div className={cn("sticky bottom-0 left-0 h-20 z-[2] px-3.5 grid place-items-center", className)}>
      <div className="h-14 w-full bg-accent-primary/10 border-[0.5px] border-accent-strong/50 py-4 px-3.5 flex items-center justify-between gap-2 rounded-md">
        <p className="text-accent-primary font-medium">
          Change state, priority, and more for several work items at once. Save three minutes on an average per
          operation.
        </p>
        <a
          href={MARKETING_PLANE_ONE_PAGE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(getButtonStyling("primary", "base"), "flex-shrink-0")}
        >
          Upgrade to One
        </a>
      </div>
    </div>
  );
}
