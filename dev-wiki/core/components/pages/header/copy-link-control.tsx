import { useState, useRef, useEffect, useCallback } from "react";
import { observer } from "mobx-react";
import { Link, Check } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageCopyLinkControl = observer(({ page }: Props) => {
  const [isCopied, setIsCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // page operations
  const { pageOperations } = usePageOperations({
    page,
  });

  // Cleanup timer on unmount
  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    []
  );

  const handleCopy = useCallback(() => {
    pageOperations.copyLink();
    setIsCopied(true);

    // Clear previous timer if it exists
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Set new timer
    timerRef.current = setTimeout(() => {
      setIsCopied(false);
      timerRef.current = null;
    }, 1000);
  }, [pageOperations]);

  return (
    <Tooltip tooltipContent={isCopied ? "Copied!" : "Copy link"} position="bottom">
      <button
        type="button"
        onClick={handleCopy}
        className="flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors duration-200 ease"
        aria-label={isCopied ? "Copied link" : "Copy link"}
      >
        <div className="relative w-3.5 h-3.5 overflow-hidden">
          <Link
            className={cn(
              "absolute inset-0 size-3.5 transition-all duration-300 ease-out",
              isCopied ? "opacity-0 scale-90" : "opacity-100 scale-100"
            )}
          />
          <Check
            className={cn(
              "absolute inset-0 size-3.5 transition-all duration-300 ease-out text-green-500",
              isCopied ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
          />
        </div>
      </button>
    </Tooltip>
  );
});
