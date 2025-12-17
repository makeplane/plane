import { TriangleAlert } from "lucide-react";
import { cn } from "@plane/utils";

type Props = {
  className?: string;
  onDismiss?: () => void;
};

export function ContentLimitBanner({ className, onDismiss }: Props) {
  return (
    <div className={cn("flex items-center gap-2 bg-layer-2 border-b border-subtle-1 px-4 py-2.5 text-sm", className)}>
      <div className="flex items-center gap-2 text-secondary mx-auto">
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
          className="ml-auto text-placeholder hover:text-secondary"
          aria-label="Dismiss content limit warning"
        >
          ✕
        </button>
      )}
    </div>
  );
}
