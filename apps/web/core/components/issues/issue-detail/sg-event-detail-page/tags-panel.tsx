import { useMemo, useState } from "react";
import { Check, ChevronDown, Columns3, ListPlus, Plus, Search, Star, Trash2, X } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu, CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import { ICON_BUTTON_CLASS, ROW_FILTER_LABELS, SURFACE_CLASS } from "./constants";
import type { RowFilterMode, SgTagRow, SportTableConfig } from "./types";
import { formatLooseLabel, parseTimecodeToSeconds } from "./utils";

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
  showCreateActions?: boolean;
  sportTableConfig: SportTableConfig;
};

const TEXT_BUTTON_CLASS =
  "inline-flex h-9 items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-3 text-xs font-medium text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100";

const CONTEXT_COLUMN_PREFIX = "context:";
const DEFAULT_VISIBLE_COLUMN_KEYS = ["duration", "player", "groupValue", "action", "primaryDetail", "result"];
const COLUMN_GROUP_ORDER = ["Core", "Sport", "Source", "Raw tag data"];

const TagsFilterIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="11" viewBox="0 0 12 11" fill="none" className={className}>
    <path
      d="M11.5 5.49971H4.15378M1.56076 5.49971H0.5M1.56076 5.49971C1.56076 5.17074 1.69732 4.85524 1.94041 4.62262C2.1835 4.39 2.5132 4.25932 2.85697 4.25932C3.20075 4.25932 3.53045 4.39 3.77354 4.62262C4.01662 4.85524 4.15319 5.17074 4.15319 5.49971C4.15319 5.82869 4.01662 6.14419 3.77354 6.37681C3.53045 6.60943 3.20075 6.74011 2.85697 6.74011C2.5132 6.74011 2.1835 6.60943 1.94041 6.37681C1.69732 6.14419 1.56076 5.82869 1.56076 5.49971ZM11.5 9.25903H8.08227M8.08227 9.25903C8.08227 9.58808 7.94538 9.90394 7.70223 10.1366C7.45909 10.3693 7.12932 10.5 6.78546 10.5C6.44168 10.5 6.11198 10.3687 5.8689 10.1361C5.62581 9.90351 5.48924 9.58801 5.48924 9.25903M8.08227 9.25903C8.08227 8.92998 7.94538 8.61469 7.70223 8.38202C7.45909 8.14935 7.12932 8.01863 6.78546 8.01863C6.44168 8.01863 6.11198 8.14932 5.8689 8.38194C5.62581 8.61456 5.48924 8.93006 5.48924 9.25903M5.48924 9.25903H0.5M11.5 1.7404H9.65378M7.06076 1.7404H0.5M7.06076 1.7404C7.06076 1.41142 7.19732 1.09592 7.44041 0.863304C7.6835 0.630684 8.01319 0.5 8.35697 0.5C8.52719 0.5 8.69575 0.532084 8.85301 0.59442C9.01028 0.656756 9.15317 0.748123 9.27354 0.863304C9.3939 0.978486 9.48938 1.11523 9.55452 1.26572C9.61966 1.41621 9.65319 1.57751 9.65319 1.7404C9.65319 1.90329 9.61966 2.06459 9.55452 2.21508C9.48938 2.36557 9.3939 2.50231 9.27354 2.61749C9.15317 2.73267 9.01028 2.82404 8.85301 2.88638C8.69575 2.94871 8.52719 2.9808 8.35697 2.9808C8.01319 2.9808 7.6835 2.85011 7.44041 2.61749C7.19732 2.38487 7.06076 2.06937 7.06076 1.7404Z"
      stroke="currentColor"
      strokeMiterlimit="10"
      strokeLinecap="round"
    />
  </svg>
);

type SgTagColumnGroup = (typeof COLUMN_GROUP_ORDER)[number];

type SgTagColumn = {
  getValue: (row: SgTagRow) => string;
  group: SgTagColumnGroup;
  isDefaultVisible?: boolean;
  key: string;
  label: string;
  width: string;
};

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

const getContextColumnKey = (key: string) => `${CONTEXT_COLUMN_PREFIX}${key}`;

const getContextKeyFromColumnKey = (key: string) => key.slice(CONTEXT_COLUMN_PREFIX.length);

const formatColumnLabel = (key: string) => formatLooseLabel(key.replace(/_/g, " "));

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
  showCreateActions = true,
  sportTableConfig,
}: SgEventTagsPanelProps) => {
  const isCompactFootballTable = Boolean(sportTableConfig.isCompactFootballTable);
  const groupSelectLabel = effectiveGroupValue === "All tags" ? "Select group" : effectiveGroupValue;
  const detailColumnLabel = isCompactFootballTable ? "Down & Dist" : sportTableConfig.primaryDetailLabel;
  const [isColumnsPanelOpen, setIsColumnsPanelOpen] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(DEFAULT_VISIBLE_COLUMN_KEYS);
  const [columnSearchQuery, setColumnSearchQuery] = useState("");
  const [collapsedColumnGroups, setCollapsedColumnGroups] = useState<Record<string, boolean>>({});

  const baseColumnDefinitions = useMemo<SgTagColumn[]>(
    () => [
      {
        getValue: getClipDuration,
        group: "Core",
        isDefaultVisible: true,
        key: "duration",
        label: "Duration (s)",
        width: "minmax(104px, 0.7fr)",
      },
      {
        getValue: (row) => row.player,
        group: "Core",
        isDefaultVisible: true,
        key: "player",
        label: sportTableConfig.playerLabel ?? "Player",
        width: "minmax(150px, 1.15fr)",
      },
      {
        getValue: (row) => row.groupValue,
        group: "Sport",
        isDefaultVisible: true,
        key: "groupValue",
        label: sportTableConfig.groupByLabel,
        width: "minmax(110px, 0.8fr)",
      },
      {
        getValue: (row) => row.action,
        group: "Sport",
        isDefaultVisible: true,
        key: "action",
        label: sportTableConfig.actionLabel,
        width: "minmax(150px, 1fr)",
      },
      {
        getValue: (row) => row.primaryDetail,
        group: "Sport",
        isDefaultVisible: true,
        key: "primaryDetail",
        label: detailColumnLabel,
        width: "minmax(130px, 0.9fr)",
      },
      {
        getValue: (row) => (isCompactFootballTable ? row.secondaryDetail : row.result),
        group: "Sport",
        isDefaultVisible: true,
        key: "result",
        label: "Result",
        width: "minmax(120px, 0.8fr)",
      },
      {
        getValue: (row) => row.team,
        group: "Source",
        key: "team",
        label: "Team",
        width: "minmax(120px, 0.8fr)",
      },
      {
        getValue: (row) => row.timecode,
        group: "Source",
        key: "timecode",
        label: "Timecode",
        width: "minmax(140px, 0.9fr)",
      },
      {
        getValue: (row) => row.clipId ?? "--",
        group: "Source",
        key: "clipId",
        label: "Clip ID",
        width: "minmax(160px, 1fr)",
      },
      {
        getValue: (row) => row.sourceTagId ?? "--",
        group: "Source",
        key: "sourceTagId",
        label: "Source tag ID",
        width: "minmax(160px, 1fr)",
      },
      {
        getValue: (row) => row.playlistTimestamp ?? "--",
        group: "Source",
        key: "playlistTimestamp",
        label: "Playlist timestamp",
        width: "minmax(190px, 1.2fr)",
      },
    ],
    [
      detailColumnLabel,
      isCompactFootballTable,
      sportTableConfig.actionLabel,
      sportTableConfig.groupByLabel,
      sportTableConfig.playerLabel,
    ]
  );
  const contextColumnDefinitions = useMemo<SgTagColumn[]>(() => {
    const contextKeys = new Set<string>();

    rows.forEach((row) => {
      Object.entries(row.context).forEach(([key, value]) => {
        if (value && value !== "--") contextKeys.add(key);
      });
    });

    return Array.from(contextKeys)
      .sort((a, b) => formatColumnLabel(a).localeCompare(formatColumnLabel(b)))
      .map((key) => {
        const columnKey = getContextColumnKey(key);

        return {
          getValue: (row: SgTagRow) => row.context[getContextKeyFromColumnKey(columnKey)] ?? "--",
          group: "Raw tag data",
          key: columnKey,
          label: formatColumnLabel(key),
          width: "minmax(150px, 1fr)",
        };
      });
  }, [rows]);
  const columnDefinitions = useMemo(
    () => [...baseColumnDefinitions, ...contextColumnDefinitions],
    [baseColumnDefinitions, contextColumnDefinitions]
  );
  const visibleColumns = useMemo(() => {
    const visibleColumnKeySet = new Set(visibleColumnKeys);
    return columnDefinitions.filter((column) => visibleColumnKeySet.has(column.key));
  }, [columnDefinitions, visibleColumnKeys]);
  const tableGridTemplateColumns = `56px minmax(120px, 150px) ${visibleColumns
    .map((column) => column.width)
    .join(" ")} 96px`;
  const normalizedColumnSearchQuery = columnSearchQuery.trim().toLowerCase();
  const columnGroups = useMemo(
    () =>
      COLUMN_GROUP_ORDER.map((groupName) => ({
        columns: columnDefinitions.filter((column) => {
          if (column.group !== groupName) return false;
          if (!normalizedColumnSearchQuery) return true;

          return `${column.label} ${column.key}`.toLowerCase().includes(normalizedColumnSearchQuery);
        }),
        name: groupName,
      })).filter((group) => group.columns.length > 0),
    [columnDefinitions, normalizedColumnSearchQuery]
  );
  const selectedAvailableColumnCount = visibleColumns.length;
  const totalColumnCount = columnDefinitions.length;

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
          {showCreateActions && (
            <button type="button" className={TEXT_BUTTON_CLASS}>
              <Plus className="h-3.5 w-3.5" />
              <span>Create Card</span>
            </button>
          )}
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
                  <TagsFilterIcon className="h-4 w-4" />
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
          <Tooltip tooltipContent="Columns" isMobile={false}>
            <button
              type="button"
              onClick={() => setIsColumnsPanelOpen(true)}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors",
                isColumnsPanelOpen
                  ? "border-custom-primary-100/30 bg-custom-primary-100/15 text-custom-primary-100"
                  : "border-custom-border-200 bg-custom-background-100 text-custom-text-300 hover:bg-custom-background-90 hover:text-custom-text-100"
              )}
            >
              <Columns3 className="h-4 w-4" />
              <span>Columns</span>
              <span className="text-custom-text-400">
                {selectedAvailableColumnCount}/{totalColumnCount}
              </span>
            </button>
          </Tooltip>
          {showCreateActions && (
            <button type="button" className={TEXT_BUTTON_CLASS}>
              <ListPlus className="h-3.5 w-3.5" />
              <span>Create Playlist</span>
            </button>
          )}
        </div>
      </div>

      <div className="vertical-scrollbar horizontal-scrollbar scrollbar-lg max-h-[520px] min-h-52 overflow-auto">
        <div className="min-w-full">
          <div
            className="sticky top-0 z-[2] grid w-max min-w-full items-center gap-3 border-b border-custom-border-200 bg-custom-sidebar-background-100 px-3 py-3 text-xs font-medium text-custom-text-300"
            style={{ gridTemplateColumns: tableGridTemplateColumns }}
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
            {visibleColumns.map((column) => (
              <div key={column.key} className="truncate" title={column.label}>
                {column.label}
              </div>
            ))}
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
              const rowThumbnailUrl = row.thumbnailUrl || clipThumbnailUrl;

              return (
                <div
                  key={row.id}
                  className={cn(
                    "grid w-max min-w-full cursor-pointer items-center gap-3 border-t border-custom-border-200 px-3 py-2 text-xs text-custom-text-200 transition-colors hover:bg-custom-background-90",
                    activePlaybackOverrideId === `sg-tag-${row.id}` && "bg-custom-background-90"
                  )}
                  style={{ gridTemplateColumns: tableGridTemplateColumns }}
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
                  {visibleColumns.map((column) => {
                    const cellValue = column.getValue(row);

                    return (
                      <div key={column.key} className="truncate" title={cellValue}>
                        {displayCellValue(cellValue)}
                      </div>
                    );
                  })}
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

      <div className="flex flex-col gap-1 border-t border-custom-border-200 px-4 py-2.5 text-xs text-custom-text-400 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {rows.length} clips · {selectedAvailableColumnCount} of {totalColumnCount} columns shown
        </span>
        {totalColumnCount > selectedAvailableColumnCount && (
          <span className="hidden sm:inline">Use Columns to show more fields</span>
        )}
      </div>

      {isMediaLoading && (
        <div className="border-t border-custom-border-200 px-4 py-2.5 text-xs text-custom-text-400">
          Syncing SG media package and playlist references for this event.
        </div>
      )}

      {isColumnsPanelOpen && (
        <div
          className="fixed inset-0 z-30 flex justify-end bg-black/50"
          role="presentation"
          onClick={() => setIsColumnsPanelOpen(false)}
        >
          <aside
            aria-label="Columns"
            aria-modal="true"
            className="flex h-full w-full max-w-[340px] flex-col border-l border-custom-border-200 bg-custom-background-100 shadow-xl"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-custom-border-200 px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-custom-text-100">Columns</h3>
                  <p className="mt-0.5 text-xs text-custom-text-400">
                    {selectedAvailableColumnCount} of {totalColumnCount} shown
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsColumnsPanelOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <label className="flex h-9 items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-90 px-3 text-sm text-custom-text-300">
                <Search className="h-4 w-4" />
                <input
                  value={columnSearchQuery}
                  onChange={(event) => setColumnSearchQuery(event.target.value)}
                  placeholder="Search columns"
                  className="min-w-0 flex-1 bg-transparent text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400"
                />
              </label>
            </div>

            <div className="flex gap-3 border-b border-custom-border-200 px-4 py-2.5">
              <button
                type="button"
                onClick={() => setVisibleColumnKeys(columnDefinitions.map((column) => column.key))}
                className="text-xs font-medium text-custom-primary-100 hover:underline"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setVisibleColumnKeys([])}
                className="text-xs font-medium text-custom-primary-100 hover:underline"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() =>
                  setVisibleColumnKeys(
                    columnDefinitions.filter((column) => column.isDefaultVisible).map((column) => column.key)
                  )
                }
                className="text-xs font-medium text-custom-primary-100 hover:underline"
              >
                Reset
              </button>
            </div>

            <div className="vertical-scrollbar scrollbar-md min-h-0 flex-1 overflow-y-auto px-2 py-2">
              {columnGroups.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-custom-text-400">No matching columns.</div>
              ) : (
                columnGroups.map((group) => {
                  const isCollapsed = Boolean(collapsedColumnGroups[group.name]);

                  return (
                    <div key={group.name} className="mb-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedColumnGroups((currentValue) => ({
                            ...currentValue,
                            [group.name]: !currentValue[group.name],
                          }))
                        }
                        className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-custom-text-400 transition-colors hover:bg-custom-background-90"
                      >
                        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isCollapsed && "-rotate-90")} />
                        <span>{group.name}</span>
                      </button>
                      {!isCollapsed && (
                        <div className="flex flex-col">
                          {group.columns.map((column) => (
                            <label
                              key={column.key}
                              className="flex cursor-pointer items-center gap-2 rounded-md px-7 py-1.5 text-sm text-custom-text-200 transition-colors hover:bg-custom-background-90"
                            >
                              <input
                                type="checkbox"
                                checked={visibleColumnKeys.includes(column.key)}
                                onChange={() =>
                                  setVisibleColumnKeys((currentValue) =>
                                    currentValue.includes(column.key)
                                      ? currentValue.filter((key) => key !== column.key)
                                      : [...currentValue, column.key]
                                  )
                                }
                                className="h-4 w-4 rounded border-custom-border-200 accent-custom-primary-100"
                              />
                              <span className="min-w-0 flex-1 truncate" title={column.label}>
                                {column.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};
