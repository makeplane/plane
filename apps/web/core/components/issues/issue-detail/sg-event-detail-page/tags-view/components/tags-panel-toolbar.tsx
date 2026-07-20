import { Check, Columns3, ListPlus, Maximize2, Minimize2, Plus, Search } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { CustomMenu, CustomSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import { ICON_BUTTON_CLASS, ROW_FILTER_LABELS } from "../../constants";
import type { RowFilterMode } from "../../types";

const TEXT_BUTTON_CLASS =
  "inline-flex h-9 items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-100 px-3 text-xs font-medium text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100";

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

type TagsPanelToolbarProps = {
  activeFilterLabel: string;
  availableGroups: string[];
  defaultGroupValue: string;
  effectiveGroupValue: string;
  groupSelectLabel: string;
  isColumnsPanelOpen: boolean;
  isCreatingPlaylist: boolean;
  isExpanded: boolean;
  isSearchOpen: boolean;
  onColumnsPanelOpen: () => void;
  onCreatePlaylist?: () => void;
  onRowFilterModeChange: (mode: RowFilterMode) => void;
  onSearchQueryChange: (value: string) => void;
  onSelectedGroupValueChange: (value: string) => void;
  onToggleExpanded?: () => void;
  onToggleSearch: () => void;
  rowFilterMode: RowFilterMode;
  searchQuery: string;
  selectedCount: number;
  selectedAvailableColumnCount: number;
  showCreateActions: boolean;
  totalColumnCount: number;
};

export const TagsPanelToolbar = ({
  activeFilterLabel,
  availableGroups,
  defaultGroupValue,
  effectiveGroupValue,
  groupSelectLabel,
  isColumnsPanelOpen,
  isCreatingPlaylist,
  isExpanded,
  isSearchOpen,
  onColumnsPanelOpen,
  onCreatePlaylist,
  onRowFilterModeChange,
  onSearchQueryChange,
  onSelectedGroupValueChange,
  onToggleExpanded,
  onToggleSearch,
  rowFilterMode,
  searchQuery,
  selectedCount,
  selectedAvailableColumnCount,
  showCreateActions,
  totalColumnCount,
}: TagsPanelToolbarProps) => (
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
        {(availableGroups.length > 0 ? availableGroups : [defaultGroupValue]).map((groupValue) => (
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
      {onToggleExpanded && (
        <Tooltip tooltipContent={isExpanded ? "Collapse list" : "Expand list"} isMobile={false}>
          <button
            type="button"
            onClick={onToggleExpanded}
            className={ICON_BUTTON_CLASS}
            aria-label={isExpanded ? "Collapse list" : "Expand list"}
            aria-pressed={isExpanded}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </Tooltip>
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
          onClick={onColumnsPanelOpen}
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
      {onCreatePlaylist && (
        <button
          type="button"
          disabled={selectedCount === 0 || isCreatingPlaylist}
          onClick={onCreatePlaylist}
          className={`${TEXT_BUTTON_CLASS} disabled:cursor-not-allowed disabled:opacity-45`}
        >
          <ListPlus className="h-3.5 w-3.5" />
          <span>{isCreatingPlaylist ? "Creating" : "Create Playlist"}</span>
        </button>
      )}
    </div>
  </div>
);
