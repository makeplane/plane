import { useEffect, useRef } from "react";
import throttle from "lodash/throttle";
import { observer } from "mobx-react";
import { useUserSettings } from "@/hooks/store";

export const SettingsContentLayout = observer(({ children }: { children: React.ReactNode }) => {
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
    <div className="w-full h-full min-h-full overflow-y-scroll " ref={ref}>
      {children}
    </div>
  );
});
