import { ReactNode, useEffect, useRef } from "react";
import throttle from "lodash/throttle";
import { observer } from "mobx-react";
import { cn } from "@plane/utils";
import { useUserSettings } from "@/hooks/store";

type TProps = {
  children: ReactNode;
  size?: "lg" | "md";
};
export const SettingsContentWrapper = observer((props: TProps) => {
  const { children, size = "md" } = props;
  // refs
  const ref = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);
  // store hooks
  const { toggleIsScrolled, isScrolled } = useUserSettings();

  useEffect(() => {
    toggleIsScrolled(false);
    const container = ref.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      if (container.scrollHeight > container.clientHeight || scrolledRef.current) {
        const _isScrolled = scrollTop > 0;
        toggleIsScrolled(_isScrolled);
      }
    };

    // Throttle the scroll handler to improve performance
    // Set trailing to true to ensure the last call runs after the delay
    const throttledHandleScroll = throttle(handleScroll, 150);

    container.addEventListener("scroll", throttledHandleScroll);
    return () => {
      container.removeEventListener("scroll", throttledHandleScroll);
      // Cancel any pending throttled invocations when unmounting
      throttledHandleScroll.cancel();
    };
  }, []);

  useEffect(() => {
    scrolledRef.current = isScrolled;
  }, [isScrolled]);

  return (
    <div
      className={cn(
        "relative flex flex-col w-full items-center mx-auto h-full min-h-full overflow-y-scroll py-4 md:py-0",
        {
          "p-4 max-w-[800px] 2xl:max-w-[1000px]": size === "md",
          "md:px-16": size === "lg",
        }
      )}
      ref={ref}
    >
      <div className="pb-20 w-full">{children}</div>
    </div>
  );
});
