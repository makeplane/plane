import { useEffect, useMemo, useState } from "react";
import { Check, Pencil, Star, Trash2 } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
import { SURFACE_CLASS } from "../../constants";
import type { RowFilterMode, SgTagRow, SgTagRowEditPayload, SportTableConfig } from "../../types";
import {
  buildEditDraft,
  COLUMN_GROUP_ORDER,
  DEFAULT_VISIBLE_COLUMN_KEYS,
  displayCellValue,
  formatColumnLabel,
  getClipDuration,
  getContextColumnKey,
  getContextKeyFromColumnKey,
  getDisplayTimecode,
  getRawTagColumnValue,
  getSportLabel,
  STANDARD_RAW_TAG_COLUMNS,
  STANDARD_RAW_TAG_CONTEXT_KEYS,
} from "../utils/tags-panel-model";
import type { SgTagColumn } from "../utils/tags-panel-model";
import { EditTagRowModal } from "./edit-tag-row-modal";
import { TagsColumnsPanel } from "./tags-columns-panel";
import { TagsPanelToolbar } from "./tags-panel-toolbar";

type SgEventTagsPanelProps = {
  activeFilterLabel: string;
  activePlaybackOverrideId: string | null;
  allVisibleSelected: boolean;
  availableGroups: string[];
  clipThumbnailUrl: string;
  effectiveGroupValue: string;
  favoriteTagIds: string[];
  isMediaLoading: boolean;
  isExpanded?: boolean;
  isSearchOpen: boolean;
  onToggleExpanded?: () => void;
  onPlayTagRow: (row: SgTagRow) => Promise<void>;
  onRemoveTag: (tagId: string) => void;
  onRowFilterModeChange: (mode: RowFilterMode) => void;
  onSearchQueryChange: (value: string) => void;
  onSelectAll: () => void;
  onSelectedGroupValueChange: (value: string) => void;
  onToggleFavorite: (tagId: string) => void;
  onToggleSearch: () => void;
  onToggleTagSelection: (tagId: string) => void;
  onUpdateTag: (tagId: string, updates: SgTagRowEditPayload) => void;
  rowFilterMode: RowFilterMode;
  rows: SgTagRow[];
  searchQuery: string;
  selectedTagIds: string[];
  showCreateActions?: boolean;
  sportTableConfig: SportTableConfig;
};

export const SgEventTagsPanel = ({
  activeFilterLabel,
  activePlaybackOverrideId,
  allVisibleSelected,
  availableGroups,
  clipThumbnailUrl,
  effectiveGroupValue,
  favoriteTagIds,
  isMediaLoading,
  isExpanded = false,
  isSearchOpen,
  onToggleExpanded,
  onPlayTagRow,
  onRemoveTag,
  onRowFilterModeChange,
  onSearchQueryChange,
  onSelectAll,
  onSelectedGroupValueChange,
  onToggleFavorite,
  onToggleSearch,
  onToggleTagSelection,
  onUpdateTag,
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
  const [editingRow, setEditingRow] = useState<SgTagRow | null>(null);
  const [editDraft, setEditDraft] = useState<SgTagRowEditPayload>(() => ({
    action: "",
    groupValue: "",
    player: "",
    primaryDetail: "",
    result: "",
    secondaryDetail: "",
    team: "",
    timecode: "",
  }));

  const baseColumnDefinitions = useMemo<SgTagColumn[]>(
    () => [
      {
        getValue: (row) => getClipDuration(row, sportTableConfig.sport),
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
        isDefaultVisible: true,
        key: "team",
        label: "Team",
        width: "minmax(120px, 0.8fr)",
      },
      {
        getValue: (row) => getDisplayTimecode(row, sportTableConfig.sport),
        group: "Source",
        isDefaultVisible: true,
        key: "timecode",
        label: "Timecode",
        width: "minmax(140px, 0.9fr)",
      },
      {
        getValue: (row) => row.clipId ?? "--",
        group: "Source",
        isDefaultVisible: true,
        key: "clipId",
        label: "Clip ID",
        width: "minmax(160px, 1fr)",
      },
      {
        getValue: (row) => row.sourceTagId ?? "--",
        group: "Source",
        isDefaultVisible: true,
        key: "sourceTagId",
        label: "Source tag ID",
        width: "minmax(160px, 1fr)",
      },
      {
        getValue: (row) => row.playlistTimestamp ?? "--",
        group: "Source",
        isDefaultVisible: true,
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
      sportTableConfig.sport,
    ]
  );
  const standardRawTagColumnDefinitions = useMemo<SgTagColumn[]>(() => {
    const sportLabel = getSportLabel(sportTableConfig.sport);

    return STANDARD_RAW_TAG_COLUMNS.map((column) => ({
      getValue: (row: SgTagRow) => getRawTagColumnValue(row, column.key, column.label, sportLabel),
      group: "Raw tag data",
      isDefaultVisible: true,
      key: getContextColumnKey(column.key),
      label: column.label,
      width: column.width,
    }));
  }, [sportTableConfig.sport]);
  const contextColumnDefinitions = useMemo<SgTagColumn[]>(() => {
    const contextKeys = new Set<string>();

    rows.forEach((row) => {
      Object.entries(row.context).forEach(([key, value]) => {
        if (STANDARD_RAW_TAG_CONTEXT_KEYS.has(key)) return;
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
    () => [...baseColumnDefinitions, ...standardRawTagColumnDefinitions, ...contextColumnDefinitions],
    [baseColumnDefinitions, contextColumnDefinitions, standardRawTagColumnDefinitions]
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
  const isEditModalOpen = Boolean(editingRow);
  const editingRowId = editingRow?.id;

  useEffect(() => {
    if (!editingRowId) return;
    const latestRow = rows.find((row) => row.id === editingRowId);
    if (latestRow) {
      setEditingRow(latestRow);
      setEditDraft(buildEditDraft(latestRow));
    }
  }, [editingRowId, rows]);

  const openEditModal = (row: SgTagRow) => {
    setEditingRow(row);
    setEditDraft(buildEditDraft(row));
  };

  const closeEditModal = () => {
    setEditingRow(null);
  };

  const updateEditDraft = (key: keyof SgTagRowEditPayload, value: string) => {
    setEditDraft((currentValue) => ({ ...currentValue, [key]: value }));
  };

  const submitEditDraft = () => {
    if (!editingRow) return;
    onUpdateTag(editingRow.id, editDraft);
    closeEditModal();
  };

  return (
    <section className={cn(SURFACE_CLASS, "overflow-hidden")}>
      <EditTagRowModal
        draft={editDraft}
        isOpen={isEditModalOpen}
        onChange={updateEditDraft}
        onClose={closeEditModal}
        onSubmit={submitEditDraft}
        row={editingRow}
      />

      <TagsPanelToolbar
        activeFilterLabel={activeFilterLabel}
        availableGroups={availableGroups}
        defaultGroupValue={sportTableConfig.defaultGroupValue}
        effectiveGroupValue={effectiveGroupValue}
        groupSelectLabel={groupSelectLabel}
        isColumnsPanelOpen={isColumnsPanelOpen}
        isExpanded={isExpanded}
        isSearchOpen={isSearchOpen}
        onColumnsPanelOpen={() => setIsColumnsPanelOpen(true)}
        onRowFilterModeChange={onRowFilterModeChange}
        onSearchQueryChange={onSearchQueryChange}
        onSelectedGroupValueChange={onSelectedGroupValueChange}
        onToggleExpanded={onToggleExpanded}
        onToggleSearch={onToggleSearch}
        rowFilterMode={rowFilterMode}
        searchQuery={searchQuery}
        selectedAvailableColumnCount={selectedAvailableColumnCount}
        showCreateActions={showCreateActions}
        totalColumnCount={totalColumnCount}
      />

      <div
        className={cn(
          "sg-event-tags-list-scrollbar vertical-scrollbar horizontal-scrollbar scrollbar-lg min-h-52 overflow-auto",
          isExpanded ? "max-h-[calc(100vh-220px)]" : "max-h-[520px]"
        )}
      >
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
                    "grid w-max min-w-full cursor-pointer items-center gap-3 border-t border-custom-border-200 px-3 py-2 text-xs text-custom-text-200 transition-colors",
                    isSelected
                      ? "bg-[#0f2638] text-custom-text-100 shadow-[inset_3px_0_0_#1780d5] hover:bg-[#123047]"
                      : "hover:bg-custom-background-90",
                    activePlaybackOverrideId === `sg-tag-${row.id}` && !isSelected && "bg-custom-background-90"
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
                          ? "border-[#1780d5] bg-[#1780d5] text-white"
                          : "border-custom-border-200 text-transparent"
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className={cn("text-custom-text-400", isSelected && "text-custom-text-100")}>
                      {index + 1}
                    </span>
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
                    <Tooltip tooltipContent="Edit row" isMobile={false}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(row);
                        }}
                        className="rounded-md p-1.5 text-custom-text-300 transition-colors hover:bg-custom-background-100 hover:text-custom-text-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </Tooltip>
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

      <TagsColumnsPanel
        collapsedColumnGroups={collapsedColumnGroups}
        columnDefinitions={columnDefinitions}
        columnGroups={columnGroups}
        columnSearchQuery={columnSearchQuery}
        isOpen={isColumnsPanelOpen}
        onClose={() => setIsColumnsPanelOpen(false)}
        onCollapsedColumnGroupsChange={setCollapsedColumnGroups}
        onColumnSearchQueryChange={setColumnSearchQuery}
        onVisibleColumnKeysChange={setVisibleColumnKeys}
        selectedAvailableColumnCount={selectedAvailableColumnCount}
        totalColumnCount={totalColumnCount}
        visibleColumnKeys={visibleColumnKeys}
      />
    </section>
  );
};
