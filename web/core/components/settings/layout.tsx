import { useRef } from "react";
import { observer } from "mobx-react";

export const SettingsContentLayout = observer(({ children }: { children: React.ReactNode }) => {
  // refs
  const ref = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full h-full min-h-full overflow-y-scroll " ref={ref}>
      {children}
    </div>
  );
});
