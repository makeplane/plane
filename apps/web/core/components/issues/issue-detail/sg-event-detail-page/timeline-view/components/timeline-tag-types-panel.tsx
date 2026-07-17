import type { Dispatch, SetStateAction } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@plane/utils";
import type { TimelineTagTypeOption } from "../utils/timeline-model";

export type TimelineTagTypeGroup = {
  name: string;
  options: TimelineTagTypeOption[];
  order: number;
};

type TimelineTagTypesPanelProps = {
  activeVisibleTagTypeKeySet: ReadonlySet<string>;
  collapsedTagTypeGroups: Record<string, boolean>;
  defaultVisibleTagTypeKeys: string[];
  isOpen: boolean;
  onClose: () => void;
  onCollapsedTagTypeGroupsChange: Dispatch<SetStateAction<Record<string, boolean>>>;
  onSearchQueryChange: (value: string) => void;
  onToggleTagType: (tagTypeKey: string) => void;
  onVisibleTagTypeKeysChange: Dispatch<SetStateAction<string[] | null>>;
  tagTypeGroups: TimelineTagTypeGroup[];
  tagTypeSearchQuery: string;
  totalTagTypeCount: number;
  visibleTagTypeCount: number;
};

export const TimelineTagTypesPanel = ({
  activeVisibleTagTypeKeySet,
  collapsedTagTypeGroups,
  defaultVisibleTagTypeKeys,
  isOpen,
  onClose,
  onCollapsedTagTypeGroupsChange,
  onSearchQueryChange,
  onToggleTagType,
  onVisibleTagTypeKeysChange,
  tagTypeGroups,
  tagTypeSearchQuery,
  totalTagTypeCount,
  visibleTagTypeCount,
}: TimelineTagTypesPanelProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/50" role="presentation" onClick={onClose}>
      <aside
        aria-label="Tag types"
        aria-modal="true"
        className="flex h-full w-full max-w-[340px] flex-col border-l border-custom-border-200 bg-custom-background-100 shadow-xl"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-custom-border-200 px-4 py-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-custom-text-100">Tag types</h3>
              <p className="mt-0.5 text-xs text-custom-text-400">
                {visibleTagTypeCount} of {totalTagTypeCount} shown
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-custom-text-300 transition-colors hover:bg-custom-background-90 hover:text-custom-text-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <label className="flex h-9 items-center gap-2 rounded-md border border-custom-border-200 bg-custom-background-90 px-3 text-sm text-custom-text-300">
            <Search className="h-4 w-4" />
            <input
              value={tagTypeSearchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder="Search tag types"
              className="min-w-0 flex-1 bg-transparent text-sm text-custom-text-100 outline-none placeholder:text-custom-text-400"
            />
          </label>
        </div>

        <div className="flex gap-3 border-b border-custom-border-200 px-4 py-2.5">
          <button
            type="button"
            onClick={() => onVisibleTagTypeKeysChange(defaultVisibleTagTypeKeys)}
            className="text-xs font-medium text-custom-primary-100 hover:underline"
          >
            Show all
          </button>
          <button
            type="button"
            onClick={() => onVisibleTagTypeKeysChange([])}
            className="text-xs font-medium text-custom-primary-100 hover:underline"
          >
            Hide all
          </button>
          <button
            type="button"
            onClick={() => onVisibleTagTypeKeysChange(null)}
            className="text-xs font-medium text-custom-primary-100 hover:underline"
          >
            Reset to default
          </button>
        </div>

        <div className="vertical-scrollbar scrollbar-md min-h-0 flex-1 overflow-y-auto px-2 py-2">
          {tagTypeGroups.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-custom-text-400">No matching tag types.</div>
          ) : (
            tagTypeGroups.map((group) => {
              const isCollapsed = Boolean(collapsedTagTypeGroups[group.name]);

              return (
                <div key={group.name} className="mb-1">
                  <button
                    type="button"
                    onClick={() =>
                      onCollapsedTagTypeGroupsChange((currentValue) => ({
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
                      {group.options.map((option) => (
                        <label
                          key={option.key}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-7 py-1.5 text-sm text-custom-text-200 transition-colors hover:bg-custom-background-90"
                        >
                          <input
                            type="checkbox"
                            checked={activeVisibleTagTypeKeySet.has(option.key)}
                            onChange={() => onToggleTagType(option.key)}
                            className="h-4 w-4 rounded border-custom-border-200 accent-custom-primary-100"
                          />
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                          <span className="min-w-0 flex-1 truncate" title={option.label}>
                            {option.label}
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
  );
};
