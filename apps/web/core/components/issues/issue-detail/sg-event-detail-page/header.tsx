import { Aperture, ArrowLeft, ChevronDown } from "lucide-react";
import { EPillSize, EPillVariant, Pill } from "@plane/propel/pill";
import { CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import type { SgEventDevice } from "./types";
import { formatLooseLabel } from "./utils";

type SgEventHeaderProps = {
  eventStatus: string;
  eventTitle: string;
  handleBack: () => void;
  isLoadingViews: boolean;
  selectedViewId: string;
  selectedViewLabel: string;
  setSelectedViewId: (value: string) => void;
  viewDevices: SgEventDevice[];
};

export const SgEventHeader = ({
  eventStatus,
  eventTitle,
  handleBack,
  isLoadingViews,
  selectedViewId,
  selectedViewLabel,
  setSelectedViewId,
  viewDevices,
}: SgEventHeaderProps) => (
  <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex h-8 items-center gap-2 rounded-[5px] px-2 text-[12px] text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)]"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>
      <div className="flex min-w-0 items-center gap-2 border-l border-[var(--sg-matrix-border)] pl-3">
        <h1 className="truncate text-[13px] font-medium text-[var(--sg-matrix-text)]">{eventTitle}</h1>
        <Pill variant={EPillVariant.PRIMARY} size={EPillSize.SM} className="shrink-0 border-none">
          Scheduled event tagged
        </Pill>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Pill
        variant={eventStatus.toLowerCase().includes("cancel") ? EPillVariant.ERROR : EPillVariant.SUCCESS}
        size={EPillSize.SM}
        className={cn(
          "w-fit shrink-0 border border-[var(--sg-matrix-status-success-border)] bg-[var(--sg-matrix-status-success-bg)] px-3 py-1 text-[var(--sg-matrix-status-success-text)]",
          {
            "border-[var(--sg-matrix-status-cancelled-border)] bg-[var(--sg-matrix-status-cancelled-bg)] text-[var(--sg-matrix-status-cancelled-text)]":
              eventStatus.toLowerCase().includes("cancel"),
          }
        )}
      >
        Status: {formatLooseLabel(eventStatus)}
      </Pill>
      <div className="flex items-center gap-2">
        {viewDevices.length > 0 ? (
          <CustomSelect
            value={selectedViewId}
            onChange={(value: string) => setSelectedViewId(value)}
            label={<span className="truncate">{selectedViewLabel}</span>}
            placement="bottom-end"
            className="h-9"
            buttonClassName="inline-flex h-8 min-w-[92px] items-center gap-2 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel)] px-3 text-[12px] text-[var(--sg-matrix-text-secondary)] hover:bg-[var(--sg-matrix-hover)]"
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
          <button className="inline-flex h-8 items-center gap-2 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel)] px-3 text-[12px] text-[var(--sg-matrix-text-secondary)]">
            <span>{isLoadingViews ? "Loading views" : "View 1"}</span>
            <ChevronDown className="h-4 w-4 text-[var(--sg-matrix-text-muted)]" />
          </button>
        )}
      </div>
    </div>
  </div>
);

type SgFullStreamButtonProps = {
  onClick: () => void;
};

export const SgFullStreamButton = ({ onClick }: SgFullStreamButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    title="Switch to full stream"
    className="inline-flex h-8 items-center gap-1.5 rounded-[5px] border border-[var(--sg-matrix-border)] bg-[var(--sg-matrix-panel)] px-3 text-[11px] font-medium text-[var(--sg-matrix-text-secondary)] transition-colors hover:bg-[var(--sg-matrix-hover)] hover:text-[var(--sg-matrix-text)]"
  >
    <Aperture className="h-3.5 w-3.5" />
    <span>Switch to full stream</span>
  </button>
);
