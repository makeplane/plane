import { useState } from "react";
import { observer } from "mobx-react";
import { SlidersHorizontal } from "lucide-react";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import { HoDatasheetDisplayProps } from "./ho-datasheet-display-props";

export const HoDatasheetToolbar = observer(function HoDatasheetToolbar() {
  const store = useHoIssues();
  const [showDisplayProps, setShowDisplayProps] = useState(false);

  const handleFromDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.setDateRange(e.target.value, store.toDate);
  };

  const handleToDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.setDateRange(store.fromDate, e.target.value);
  };

  return (
    <div className="relative flex items-center justify-between gap-3 border-b border-subtle bg-surface-1 px-page-x py-2">
      {/* Date range pickers */}
      <div className="flex items-center gap-2">
        <span className="text-13 font-medium text-secondary">From</span>
        <input
          type="date"
          value={store.fromDate}
          onChange={handleFromDate}
          className="rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary outline-none focus:border-accent-primary transition-colors"
        />
        <span className="text-13 font-medium text-secondary">To</span>
        <input
          type="date"
          value={store.toDate}
          onChange={handleToDate}
          className="rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary outline-none focus:border-accent-primary transition-colors"
        />
      </div>

      {/* Display properties toggle */}
      <button
        type="button"
        onClick={() => setShowDisplayProps((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-1.5 text-13 font-medium text-secondary hover:bg-layer-2 hover:text-primary transition-colors"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Display
      </button>

      {/* Display properties popover */}
      {showDisplayProps && (
        <div className="absolute right-4 top-10 z-30">
          <HoDatasheetDisplayProps />
        </div>
      )}
    </div>
  );
});
