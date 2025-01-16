// plane ui
import { RecentStickyIcon } from "@plane/ui";

export const StickiesEmptyState = () => (
  <div className="min-h-[110px] flex w-full justify-center py-6 bg-custom-border-100 rounded">
    <div className="m-auto flex gap-2">
      <RecentStickyIcon className="h-[30px] w-[30px] text-custom-text-400/40" />
      <div className="text-custom-text-400 text-sm text-center my-auto">
        No stickies yet. Add one to start making quick notes.
      </div>
    </div>
  </div>
);
