import { observer } from "mobx-react";
import { Crown } from "lucide-react";
// ui
import { getButtonStyling } from "@plane/ui";
// constants
import { MARKETING_PRICING_PAGE_LINK } from "@/constants/common";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useMultipleSelectStore } from "@/hooks/store";

type Props = {
  className?: string;
};

export const IssueBulkOperationsRoot: React.FC<Props> = observer((props) => {
  const { className } = props;
  // store hooks
  const { isSelectionActive } = useMultipleSelectStore();

  if (!isSelectionActive) return null;

  return (
    <div className={cn("sticky bottom-0 left-0 z-[2] h-14", className)}>
      <div className="size-full bg-custom-background-100 border-t border-custom-border-200 py-4 px-3.5 flex items-center justify-between gap-2">
        <p className="text-sm text-custom-text-300">
          All features within bulk operations are available in our Pro plan and above. Upgrade now to boost
          productivity.
        </p>
        <a
          href={MARKETING_PRICING_PAGE_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(getButtonStyling("primary", "sm"), "flex-shrink-0")}
        >
          <Crown className="size-3" />
          Upgrade
        </a>
      </div>
    </div>
  );
});
