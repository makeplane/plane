import { useEffect, useRef } from "react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/propel/utils";
import { SingleOrArray, TFilterValue } from "@plane/types";
import { hasValidValue } from "@plane/utils";

interface FilterItemContainerProps {
  children: React.ReactNode;
  conditionValue: SingleOrArray<TFilterValue>;
  showTransition: boolean;
  variant?: "default" | "error";
  tooltipContent?: React.ReactNode;
}

export const FilterItemContainer: React.FC<FilterItemContainerProps> = (props) => {
  const { children, conditionValue, showTransition, variant = "default", tooltipContent } = props;
  // refs
  const itemRef = useRef<HTMLDivElement>(null);

  // effects
  useEffect(() => {
    if (!showTransition) return;

    const element = itemRef.current;
    if (!element) return;

    if (hasValidValue(conditionValue)) return;

    const applyInitialStyles = () => {
      element.style.opacity = "0";
      element.style.transform = "scale(0.95)";
    };

    const applyFinalStyles = () => {
      // Force a reflow to ensure the initial state is applied
      void element.offsetWidth;
      element.style.opacity = "1";
      element.style.transform = "scale(1)";
    };

    applyInitialStyles();
    applyFinalStyles();

    return () => {
      applyInitialStyles();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Tooltip tooltipContent={tooltipContent} position="bottom" disabled={!tooltipContent}>
      <div
        ref={itemRef}
        className={cn("flex h-7 items-stretch rounded overflow-hidden border transition-all duration-200", {
          "border-custom-border-200 bg-custom-background-100": variant === "default",
          "border-red-500 bg-custom-background-90": variant === "error",
        })}
      >
        {children}
      </div>
    </Tooltip>
  );
};
