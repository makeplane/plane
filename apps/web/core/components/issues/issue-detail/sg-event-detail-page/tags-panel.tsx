import { Check, ChevronDown, ChevronRight, Filter, Search, Star } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { Collapsible, CustomMenu, CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import {
  FOOTBALL_TAG_TABLE_GRID_CLASS,
  ICON_BUTTON_CLASS,
  ROW_FILTER_LABELS,
  SURFACE_CLASS,
  TAG_TABLE_GRID_CLASS,
} from "./constants";
import type { RowFilterMode, SgTagRow, SportTableConfig } from "./types";

type SgEventTagsPanelProps = {
  activeFilterLabel: string;
  activePlaybackOverrideId: string | null;
  allVisibleSelected: boolean;
  availableGroups: string[];
  closedGroups: string[];
  effectiveGroupValue: string;
  favoriteTagIds: string[];
  groupedRows: Record<string, SgTagRow[]>;
  isMediaLoading: boolean;
  isSearchOpen: boolean;
  onPlayTagRow: (row: SgTagRow) => Promise<void>;
  onRowFilterModeChange: (mode: RowFilterMode) => void;
  onSearchQueryChange: (value: string) => void;
  onSelectAll: () => void;
  onSelectedGroupValueChange: (value: string) => void;
  onToggleClosedGroup: (groupValue: string) => void;
  onToggleFavorite: (tagId: string) => void;
  onToggleSearch: () => void;
  onToggleTagSelection: (tagId: string) => void;
  rowFilterMode: RowFilterMode;
  searchQuery: string;
  selectedTagIds: string[];
  sportTableConfig: SportTableConfig;
};

export const SgEventTagsPanel = ({
  activeFilterLabel,
  activePlaybackOverrideId,
  allVisibleSelected,
  availableGroups,
  closedGroups,
  effectiveGroupValue,
  favoriteTagIds,
  groupedRows,
  isMediaLoading,
  isSearchOpen,
  onPlayTagRow,
  onRowFilterModeChange,
  onSearchQueryChange,
  onSelectAll,
  onSelectedGroupValueChange,
  onToggleClosedGroup,
  onToggleFavorite,
  onToggleSearch,
  onToggleTagSelection,
  rowFilterMode,
  searchQuery,
  selectedTagIds,
  sportTableConfig,
}: SgEventTagsPanelProps) => {
  const isCompactFootballTable = Boolean(sportTableConfig.isCompactFootballTable);
  const tableGridClass = isCompactFootballTable ? FOOTBALL_TAG_TABLE_GRID_CLASS : TAG_TABLE_GRID_CLASS;
  const tableSurfaceWidthClass = isCompactFootballTable ? "min-w-[1024px]" : "min-w-[1120px]";

  return (
    <section className={cn(SURFACE_CLASS, "overflow-hidden")}>
      <div className="flex flex-col gap-3 border-b border-custom-border-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-custom-text-100">Group by :</span>
          <CustomSelect
            value={effectiveGroupValue}
            onChange={(value: string) => onSelectedGroupValueChange(value)}
            label={<span className="truncate">{effectiveGroupValue}</span>}
            placement="bottom-start"
            className="h-9"
            buttonClassName="h-9 min-w-[120px] rounded-lg border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 hover:bg-custom-background-90"
            optionsClassName="min-w-[140px]"
          >
            <CustomSelect.Option value="All tags">
              <span className="text-sm">All tags</span>
            </CustomSelect.Option>
            {(availableGroups.length > 0 ? availableGroups : [sportTableConfig.defaultGroupValue]).map((groupValue) => (
              <CustomSelect.Option key={groupValue} value={groupValue}>
                <span className="text-sm">{groupValue}</span>
              </CustomSelect.Option>
            ))}
          </CustomSelect>
          <span className="text-xs text-custom-text-400">{sportTableConfig.groupByLabel}</span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {isSearchOpen && (
            <label className="flex h-9 items-center gap-2 rounded-lg border border-custom-border-200 bg-custom-background-100 px-3 text-sm text-custom-text-300">
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
                    "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
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
        </div>
      </div>

      <div className="max-h-[520px] overflow-x-scroll overflow-y-auto">
        <div className={cn("min-w-full", tableSurfaceWidthClass)}>
          <div
            className={cn(
              "sticky top-0 z-[2] grid min-w-full gap-3 border-b border-custom-border-200 bg-custom-sidebar-background-100 px-5 py-3 text-xs text-custom-text-300",
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
            <div>Time code</div>
            <div>{sportTableConfig.playerLabel ?? "Player"}</div>
            <div>Team</div>
            <div>{sportTableConfig.actionLabel}</div>
            <div>Result</div>
            <div>{sportTableConfig.primaryDetailLabel}</div>
            {!isCompactFootballTable && <div>{sportTableConfig.secondaryDetailLabel}</div>}
            <div>Actions</div>
          </div>

          {Object.entries(groupedRows).length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-custom-text-400">
              No SG tags matched the current filter set.
            </div>
          ) : (
            Object.entries(groupedRows).map(([groupValue, rows]) => {
              const isOpen = !closedGroups.includes(groupValue);

              return (
                <div key={groupValue} className="border-t border-custom-border-200 first:border-t-0">
                  <Collapsible
                    isOpen={isOpen}
                    onToggle={() => onToggleClosedGroup(groupValue)}
                    title={
                      <div
                        className={cn(
                          "grid min-w-full items-center gap-3 bg-custom-background-90 px-5 py-3",
                          tableGridClass
                        )}
                      >
                        <div className="text-xs text-custom-text-300">
                          {rows.length} row{rows.length === 1 ? "" : "s"}
                        </div>
                        <div
                          className={cn(
                            "flex items-center gap-3",
                            isCompactFootballTable ? "col-span-6" : "col-span-7"
                          )}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-custom-text-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-custom-text-400" />
                          )}
                          <span className="text-lg font-medium text-custom-text-100">{groupValue}</span>
                        </div>
                      </div>
                    }
                    buttonClassName="w-full text-left transition-colors hover:bg-custom-background-80"
                  >
                    <div>
                      {rows.map((row, index) => {
                        const isSelected = selectedTagIds.includes(row.id);
                        const isFavorited = favoriteTagIds.includes(row.id);

                        return (
                          <div
                            key={row.id}
                            className={cn(
                              "grid min-w-full cursor-pointer gap-3 border-t border-custom-border-200 px-5 py-3 text-sm text-custom-text-200 transition-colors hover:bg-custom-background-90",
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
                            <div>{row.timecode}</div>
                            <div className="truncate" title={row.player}>
                              {row.player}
                            </div>
                            <div>{row.team}</div>
                            <div className="truncate" title={row.action}>
                              {row.action}
                            </div>
                            <div>{row.result}</div>
                            <div>{isCompactFootballTable ? row.secondaryDetail : row.primaryDetail}</div>
                            {!isCompactFootballTable && <div>{row.secondaryDetail}</div>}
                            <div className="flex items-center gap-2">
                              <Tooltip tooltipContent={isFavorited ? "Remove favorite" : "Favorite"} isMobile={false}>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onToggleFavorite(row.id);
                                  }}
                                  className="rounded-md p-1.5 text-custom-text-300 transition-colors hover:bg-custom-background-100 hover:text-[#d0a64a]"
                                >
                                  <Star
                                    className={cn("h-4 w-4", {
                                      "fill-[#d0a64a] text-[#d0a64a]": isFavorited,
                                    })}
                                  />
                                </button>
                              </Tooltip>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Collapsible>
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
