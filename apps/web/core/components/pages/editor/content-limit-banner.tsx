import { TriangleAlert } from "lucide-react";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
  onDismiss?: () => void;
};

export const ContentLimitBanner: React.FC<Props> = ({ className, onDismiss }) => (
  <div
    className={cn(
      "flex items-center gap-2 bg-custom-background-80 border-b border-custom-border-200 px-4 py-2.5 text-sm",
      className
    )}
  >
    <div className="flex items-center gap-2 text-custom-text-200 mx-auto">
      <span className="text-amber-500">
        <TriangleAlert />
      </span>
      <span className="font-medium">
        Content limit reached and live sync is off. Create a new page or use nested pages to continue syncing.
      </span>
    </div>
    {onDismiss && (
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto text-custom-text-300 hover:text-custom-text-200"
        aria-label="Dismiss content limit warning"
      >
        ✕
      </button>
    )}
  </div>
);
