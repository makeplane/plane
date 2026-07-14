import { Aperture, ArrowLeft, ChevronDown, Grid3x3, List, SlidersHorizontal } from "lucide-react";
import { EPillSize, EPillVariant, Pill } from "@plane/propel/pill";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import type { TMediaItem } from "ce/features/media-library/types/media-library.types";
import type { SgEventDevice, SgEventTagViewMode } from "./types";
import { formatLooseLabel } from "./utils";

type SgEventHeaderProps = {
  eventStatus: string;
  eventTitle: string;
  fullStreamPlaybackItem: TMediaItem | null;
  handleBack: () => void;
  handleSwitchToFullStream: () => void;
  isMatrixViewEnabled?: boolean;
  isLoadingViews: boolean;
  isTagClipActive: boolean;
  selectedViewId: string;
  selectedViewLabel: string;
  setSelectedViewId: (value: string) => void;
  setTagViewMode: (value: SgEventTagViewMode) => void;
  tagViewMode: SgEventTagViewMode;
  viewDevices: SgEventDevice[];
};

const getViewModeButtonClass = (isActive: boolean, hasBorder = true) =>
  cn(
    "inline-flex h-8 w-8 items-center justify-center transition-colors",
    hasBorder && "border-l border-custom-border-200",
    isActive
      ? "bg-custom-background-80 text-custom-text-100"
      : "text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-100"
  );

export const SgEventHeader = ({
  fullStreamPlaybackItem,
  handleBack,
  handleSwitchToFullStream,
  isMatrixViewEnabled = false,
  isLoadingViews,
  isTagClipActive,
  selectedViewId,
  selectedViewLabel,
  setSelectedViewId,
  setTagViewMode,
  tagViewMode,
  viewDevices,
}: SgEventHeaderProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-sm text-custom-text-300 transition-colors hover:bg-custom-background-80 hover:text-custom-text-100"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Back</span>
    </button>

    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 md:flex">
        {viewDevices.length > 0 ? (
          <CustomSelect
            value={selectedViewId}
            onChange={(value: string) => setSelectedViewId(value)}
            label={<span className="truncate">{selectedViewLabel}</span>}
            placement="bottom-end"
            className="h-9"
            buttonClassName="inline-flex h-8 min-w-[92px] items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-3 text-sm text-custom-text-100 hover:bg-custom-background-90"
            optionsClassName="min-w-[140px]"
          >
            {viewDevices.map((device, index) => (
              <CustomSelect.Option key={device.id} value={String(device.id)}>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm">{`View ${index + 1}`}</span>
                  <span className="truncate text-xs text-custom-text-400">{device.streamName}</span>
                </div>
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        ) : (
          <button className="inline-flex h-8 items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-3 text-sm text-custom-text-100">
            <span>{isLoadingViews ? "Loading views" : "View 1"}</span>
            <ChevronDown className="h-4 w-4 text-custom-text-400" />
          </button>
        )}
        {fullStreamPlaybackItem && isTagClipActive && (
          <Tooltip tooltipContent="Switch to full stream" isMobile={false}>
            <button
              type="button"
              onClick={handleSwitchToFullStream}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-custom-border-200 bg-custom-background-100 text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100"
            >
              <Aperture className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
        <div className="inline-flex h-8 overflow-hidden rounded-md border border-custom-border-200 bg-custom-background-100">
          <Tooltip tooltipContent="List view" isMobile={false}>
            <button
              type="button"
              onClick={() => setTagViewMode("list")}
              className={getViewModeButtonClass(tagViewMode === "list", false)}
            >
              <List className="h-4 w-4" />
            </button>
          </Tooltip>
          {isMatrixViewEnabled && (
            <Tooltip tooltipContent="Matrix view" isMobile={false}>
              <button
                type="button"
                onClick={() => setTagViewMode("matrix")}
                className={getViewModeButtonClass(tagViewMode === "matrix")}
              >
                <Grid3x3 className="h-3.5 w-3.5" />
              </button>
            </Tooltip>
          )}
          <Tooltip tooltipContent="Timeline view" isMobile={false}>
            <button
              type="button"
              onClick={() => setTagViewMode("timeline")}
              className={getViewModeButtonClass(tagViewMode === "timeline")}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  </div>
);

export const SgEventTitleBar = ({
  eventStatus,
  eventTitle,
  handleSwitchToFullStream,
  isTagClipActive,
}: Pick<SgEventHeaderProps, "eventStatus" | "eventTitle" | "handleSwitchToFullStream" | "isTagClipActive">) => (
  <div className="flex flex-col gap-3 px-0.5 lg:flex-row lg:items-center lg:justify-between">
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <h1 className="truncate text-base font-semibold text-custom-text-100">{eventTitle}</h1>
      {isTagClipActive && (
        <button
          type="button"
          onClick={handleSwitchToFullStream}
          className="inline-flex h-7 items-center gap-1.5 rounded-full border border-custom-border-200 bg-custom-background-100 px-3 text-xs text-custom-text-100 transition-colors hover:bg-custom-background-90"
        >
          <Aperture className="h-3.5 w-3.5" />
          <span>Switch to full stream</span>
        </button>
      )}
      <Pill variant={EPillVariant.PRIMARY} size={EPillSize.SM} className="border-none">
        Scheduled event tagged
      </Pill>
    </div>
    <Pill
      variant={eventStatus.toLowerCase().includes("complete") ? EPillVariant.SUCCESS : EPillVariant.PRIMARY}
      size={EPillSize.SM}
      className={cn("w-fit border-none", {
        "bg-red-50 text-red-700": eventStatus.toLowerCase().includes("cancel"),
      })}
    >
      Status: {formatLooseLabel(eventStatus)}
    </Pill>
  </div>
);
