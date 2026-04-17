import { useState, useRef, useEffect } from "react";
import { observer } from "mobx-react";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import { HoDatasheetDisplayProps } from "./ho-datasheet-display-props";
import { HoWorkspaceSelect } from "./ho-workspace-select";
import { HoProjectSelect } from "./ho-project-select";

export const HoDatasheetToolbar = observer(function HoDatasheetToolbar() {
  const { t } = useTranslation();
  const store = useHoIssues();
  const [showDisplayProps, setShowDisplayProps] = useState(false);
  const displayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDisplayProps) return;
    const handler = (e: MouseEvent) => {
      if (displayRef.current && !displayRef.current.contains(e.target as Node)) {
        setShowDisplayProps(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDisplayProps]);

  const handleFromDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.setDateRange(e.target.value, store.toDate);
  };

  const handleToDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.setDateRange(store.fromDate, e.target.value);
  };

  return (
    <div className="relative flex items-center justify-between gap-3 border-b border-subtle bg-surface-1 px-page-x py-2">
      {/* Left: Date range pickers */}
      <div className="flex items-center gap-2">
        <span className="text-13 font-medium text-secondary">{t("ho.from")}</span>
        <input
          type="date"
          value={store.fromDate}
          onChange={handleFromDate}
          className="rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary outline-none focus:border-accent-primary transition-colors"
        />
        <span className="text-13 font-medium text-secondary">{t("ho.to")}</span>
        <input
          type="date"
          value={store.toDate}
          onChange={handleToDate}
          className="rounded-md border border-subtle bg-layer-2 px-3 py-1.5 text-13 text-primary outline-none focus:border-accent-primary transition-colors"
        />
      </div>

      {/* Right: Filters + Display toggle */}
      <div className="flex items-center gap-2">
        {/* Archive visibility toggle */}
        <label className="flex cursor-pointer items-center gap-1.5 select-none">
          <Switch value={store.showArchived} onChange={(v) => store.setShowArchived(v)} size="sm" />
          <span className="text-13 text-secondary">{t("ho.show_archived")}</span>
        </label>
        <HoWorkspaceSelect />
        <HoProjectSelect />
        <button
          type="button"
          onClick={() => setShowDisplayProps((v) => !v)}
          className="flex items-center gap-2 rounded-md border border-subtle bg-surface-1 px-3 py-1.5 text-13 font-medium text-secondary hover:bg-layer-2 hover:text-primary transition-colors"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("ho.display")}
        </button>
      </div>

      {/* Display properties popover */}
      {showDisplayProps && (
        <div ref={displayRef} className="absolute right-4 top-10 z-30">
          <HoDatasheetDisplayProps />
        </div>
      )}
    </div>
  );
});
