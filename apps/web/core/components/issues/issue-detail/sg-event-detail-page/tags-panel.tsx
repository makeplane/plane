import { Check, Filter, ListPlus, Plus, Search, SlidersHorizontal, Star, Trash2 } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu, CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import {
  FOOTBALL_TAG_TABLE_GRID_CLASS,
  ICON_BUTTON_CLASS,
  ROW_FILTER_LABELS,
  SURFACE_CLASS,
  TAG_TABLE_GRID_CLASS,
} from "./constants";
import type { RowFilterMode, SgTagRow, SportTableConfig } from "./types";
import { parseTimecodeToSeconds } from "./utils";

type SgEventTagsPanelProps = {
  activeFilterLabel: string;
  activePlaybackOverrideId: string | null;
  allVisibleSelected: boolean;
  availableGroups: string[];
  clipThumbnailUrl: string;
  effectiveGroupValue: string;
  favoriteTagIds: string[];
  isMediaLoading: boolean;
  isSearchOpen: boolean;
  onPlayTagRow: (row: SgTagRow) => Promise<void>;
  onRemoveTag: (tagId: string) => void;
  onRowFilterModeChange: (mode: RowFilterMode) => void;
  onSearchQueryChange: (value: string) => void;
  onSelectAll: () => void;
  onSelectedGroupValueChange: (value: string) => void;
  onToggleFavorite: (tagId: string) => void;
  onToggleSearch: () => void;
  onToggleTagSelection: (tagId: string) => void;
  rowFilterMode: RowFilterMode;
  rows: SgTagRow[];
  searchQuery: string;
  selectedTagIds: string[];
  sportTableConfig: SportTableConfig;
};

const TEXT_BUTTON_CLASS =
  "inline-flex h-9 items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-3 text-xs font-medium text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100";

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
  }

  return [minutes, remainingSeconds].map((value) => String(value).padStart(2, "0")).join(":");
};

const getClipDuration = (row: SgTagRow) => {
  if (row.clipStartSeconds !== null && row.clipEndSeconds !== null && row.clipEndSeconds > row.clipStartSeconds) {
    return formatDuration(row.clipEndSeconds - row.clipStartSeconds);
  }

  const rangeParts = row.timecode.split(/\s*[-\u2013\u2014]\s*/).filter(Boolean);
  if (rangeParts.length >= 2) {
    const start = parseTimecodeToSeconds(rangeParts[0]);
    const end = parseTimecodeToSeconds(rangeParts[1]);

    if (start !== null && end !== null && end > start) {
      return formatDuration(end - start);
    }
  }

  return "--";
};

const displayCellValue = (value: string) => (value && value !== "--" ? value : "--");

export const SgEventTagsPanel = ({
  activeFilterLabel,
  activePlaybackOverrideId,
  allVisibleSelected,
  availableGroups,
  clipThumbnailUrl,
  effectiveGroupValue,
  favoriteTagIds,
  isMediaLoading,
  isSearchOpen,
  onPlayTagRow,
  onRemoveTag,
  onRowFilterModeChange,
  onSearchQueryChange,
  onSelectAll,
  onSelectedGroupValueChange,
  onToggleFavorite,
  onToggleSearch,
  onToggleTagSelection,
  rowFilterMode,
  rows,
  searchQuery,
  selectedTagIds,
  sportTableConfig,
}: SgEventTagsPanelProps) => {
  const isCompactFootballTable = Boolean(sportTableConfig.isCompactFootballTable);
  const tableGridClass = isCompactFootballTable ? FOOTBALL_TAG_TABLE_GRID_CLASS : TAG_TABLE_GRID_CLASS;
  const tableSurfaceWidthClass = "min-w-[1160px]";
  const groupSelectLabel = effectiveGroupValue === "All tags" ? "Select group" : effectiveGroupValue;
  const detailColumnLabel = isCompactFootballTable ? "Down & Dist" : sportTableConfig.primaryDetailLabel;

  return (
    <section className={cn(SURFACE_CLASS, "overflow-hidden")}>
      <div className="flex flex-col gap-3 border-b border-custom-border-200 px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-custom-text-100">Group by :</span>
          <CustomSelect
            value={effectiveGroupValue}
            onChange={(value: string) => onSelectedGroupValueChange(value)}
            label={<span className="truncate">{groupSelectLabel}</span>}
            placement="bottom-start"
            className="h-8"
            buttonClassName="h-8 min-w-[112px] rounded-md border border-custom-border-200 bg-custom-background-100 px-3 py-1.5 text-xs text-custom-text-300 hover:bg-custom-background-90"
            optionsClassName="min-w-[140px]"
          >
            <CustomSelect.Option value="All tags">
              <span className="text-sm">All clips</span>
            </CustomSelect.Option>
            {(availableGroups.length > 0 ? availableGroups : [sportTableConfig.defaultGroupValue]).map((groupValue) => (
              <CustomSelect.Option key={groupValue} value={groupValue}>
                <span className="text-sm">{groupValue}</span>
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" className={TEXT_BUTTON_CLASS}>
            <Plus className="h-3.5 w-3.5" />
            <span>Create Card</span>
          </button>
          {isSearchOpen && (
            <label className="flex h-9 items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-3 text-sm text-custom-text-300">
              <Search className="h-4 w-4" />
              <input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Search"
                className="w-32 bg-transparent text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400"
              />
            </label>
          )}
          <Tooltip tooltipContent={isSearchOpen ? "Hide search" : "Search"} isMobile={false}>
            <button type="button" onClick={onToggleSearch} className={ICON_BUTTON_CLASS}>
              <Search className="h-4 w-4" />
            </button>
          </Tooltip>
          <CustomMenu
            placement="bottom-end"
            closeOnSelect
            customButton={
              <Tooltip tooltipContent={`Filter: ${activeFilterLabel}`} isMobile={false}>
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
                    rowFilterMode !== "all"
                      ? "border-custom-primary-100/30 bg-custom-primary-100/15 text-custom-primary-100"
                      : "border-custom-border-200 bg-custom-background-100 text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-100"
                  )}
                >
                  <Filter className="h-4 w-4" />
                </button>
              </Tooltip>
            }
          >
            {(Object.keys(ROW_FILTER_LABELS) as RowFilterMode[]).map((mode) => (
              <CustomMenu.MenuItem
                key={mode}
                className="flex items-center justify-between gap-2"
                onClick={() => onRowFilterModeChange(mode)}
              >
                {ROW_FILTER_LABELS[mode]}
                {rowFilterMode === mode && <Check className="h-3 w-3" />}
              </CustomMenu.MenuItem>
            ))}
          </CustomMenu>
          <Tooltip tooltipContent="Display options" isMobile={false}>
            <button type="button" className={ICON_BUTTON_CLASS}>
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          </Tooltip>
          <button type="button" className={TEXT_BUTTON_CLASS}>
            <ListPlus className="h-3.5 w-3.5" />
            <span>Create Playlist</span>
          </button>
        </div>
      </div>

      <div className="max-h-[520px] overflow-x-scroll overflow-y-auto">
        <div className={cn("min-w-full", tableSurfaceWidthClass)}>
          <div
            className={cn(
              "sticky top-0 z-[2] grid min-w-full items-center gap-3 border-b border-custom-border-200 bg-custom-sidebar-background-100 px-3 py-3 text-xs font-medium text-custom-text-300",
              tableGridClass
            )}
          >
            <button type="button" onClick={onSelectAll} className="flex items-center gap-2 text-left">
              <span
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded border",
                  allVisibleSelected
                    ? "border-custom-primary-100 bg-custom-primary-100 text-white"
                    : "border-custom-border-200 text-transparent"
                )}
              >
                <Check className="h-3 w-3" />
              </span>
              <span>No.</span>
            </button>
            <div>Clip</div>
            <div>Duration (s)</div>
            <div>{sportTableConfig.playerLabel ?? "Player"}</div>
            <div>{sportTableConfig.groupByLabel}</div>
            <div>{sportTableConfig.actionLabel}</div>
            <div>{detailColumnLabel}</div>
            <div>Result</div>
            <div>Action</div>
          </div>

          {rows.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-custom-text-400">
              No SG tags matched the current filter set.
            </div>
          ) : (
            rows.map((row, index) => {
              const isSelected = selectedTagIds.includes(row.id);
              const isFavorited = favoriteTagIds.includes(row.id);
              const resultValue = isCompactFootballTable ? row.secondaryDetail : row.result;
              const rowThumbnailUrl = row.thumbnailUrl || clipThumbnailUrl;

              return (
                <div
                  key={row.id}
                  className={cn(
                    "grid min-w-full cursor-pointer items-center gap-3 border-t border-custom-border-200 px-3 py-2 text-xs text-custom-text-200 transition-colors hover:bg-custom-background-90",
                    activePlaybackOverrideId === `sg-tag-${row.id}` && "bg-custom-background-90",
                    tableGridClass
                  )}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    void onPlayTagRow(row);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      void onPlayTagRow(row);
                    }
                  }}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleTagSelection(row.id);
                    }}
                    className="flex items-center gap-2 text-left"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border",
                        isSelected
                          ? "border-custom-primary-100 bg-custom-primary-100 text-white"
                          : "border-custom-border-200 text-transparent"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="text-custom-text-400">{index + 1}</span>
                  </button>
                  <div className="h-10 w-[74px] overflow-hidden rounded bg-custom-background-80">
                    {rowThumbnailUrl ? (
                      <img src={rowThumbnailUrl} alt="" className="h-full w-full object-cover" draggable={false} />
                    ) : (
                      <div className="h-full w-full bg-custom-background-90" />
                    )}
                  </div>
                  <div>{getClipDuration(row)}</div>
                  <div className="truncate" title={row.player}>
                    {displayCellValue(row.player)}
                  </div>
                  <div className="truncate" title={row.groupValue}>
                    {displayCellValue(row.groupValue)}
                  </div>
                  <div className="truncate" title={row.action}>
                    {displayCellValue(row.action)}
                  </div>
                  <div className="truncate" title={row.primaryDetail}>
                    {displayCellValue(row.primaryDetail)}
                  </div>
                  <div className="truncate" title={resultValue}>
                    {displayCellValue(resultValue)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tooltip tooltipContent={isFavorited ? "Remove favorite" : "Favorite"} isMobile={false}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onToggleFavorite(row.id);
                        }}
                        className="rounded-md p-1.5 text-[#d0a64a] transition-colors hover:bg-custom-background-100"
                      >
                        <Star
                          className={cn("h-4 w-4", {
                            "fill-[#d0a64a]": isFavorited,
                          })}
                        />
                      </button>
                    </Tooltip>
                    <Tooltip tooltipContent="Remove row" isMobile={false}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRemoveTag(row.id);
                        }}
                        className="rounded-md p-1.5 text-red-500 transition-colors hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isMediaLoading && (
        <div className="border-t border-custom-border-200 px-4 py-2.5 text-xs text-custom-text-400">
          Syncing SG media package and playlist references for this event.
        </div>
      )}
    </section>
  );
};
