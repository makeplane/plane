import { useState, useRef, useEffect, useCallback } from "react";
import { observer } from "mobx-react";

import { LinkIcon, CheckIcon } from "@plane/propel/icons";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { IconButton } from "@plane/propel/icon-button";
import { cn } from "@plane/utils";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageCopyLinkControl = observer(function PageCopyLinkControl({ page }: Props) {
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
      <IconButton
        variant="ghost"
        size="lg"
        icon={isCopied ? CheckIcon : LinkIcon}
        onClick={handleCopy}
        aria-label={isCopied ? "Copied link" : "Copy link"}
        className={cn(isCopied && "text-success-primary")}
      />
    </Tooltip>
  );
});
