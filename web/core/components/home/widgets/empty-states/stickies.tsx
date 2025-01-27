// plane ui
import { RecentStickyIcon } from "@plane/ui";

export const StickiesEmptyState = () => (
  <div className="min-h-[110px] w-full flex items-center justify-center gap-2 py-6 bg-custom-background-90 text-custom-text-400 rounded">
    <div className="flex-shrink-0 size-[30px] grid place-items-center">
      <RecentStickyIcon className="size-6" />
    </div>
    <p className="text-sm text-center font-medium">
      Jot down an idea, capture an aha, or record a brainwave. Add a sticky to get started.
    </p>
  </div>
);
