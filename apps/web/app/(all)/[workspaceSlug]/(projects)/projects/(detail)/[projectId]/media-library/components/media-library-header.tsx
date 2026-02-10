"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, ChevronDown, Clock3, LayoutGrid, List, Search, Upload, X } from "lucide-react";

// UI
import { Button } from "@plane/propel/button";
import { COMPARISON_OPERATOR, LOGICAL_OPERATOR } from "@plane/types";
import { Breadcrumbs, Header, Tooltip } from "@plane/ui";
import { renderFormattedPayloadDate } from "@plane/utils";

// Components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { DateRangeDropdown } from "@/components/dropdowns/date-range";
import { TimeDropdown } from "@/components/dropdowns/time-picker";
import { FiltersToggle } from "@/components/rich-filters/filters-toggle";

// Hooks
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
import { useMediaLibrary } from "../state/media-library-context";

/* ------------------------------------------------------------------ */
/* TYPES */
/* ------------------------------------------------------------------ */

export enum MediaLayoutTypes {
  LIST = "list",
  GRID = "grid",
}

type LayoutItem = {
  key: MediaLayoutTypes;
  i18n_title: string;
};

type Props = {
  layouts?: LayoutItem[];
};

/* ------------------------------------------------------------------ */
/* DEFAULTS */
/* ------------------------------------------------------------------ */

const DEFAULT_LAYOUTS: LayoutItem[] = [
  { key: MediaLayoutTypes.GRID, i18n_title: "Grid" },
  { key: MediaLayoutTypes.LIST, i18n_title: "List" },
];

const START_DATE_FILTER_PROPERTY = "meta.start_date";
const START_TIME_FILTER_PROPERTY = "meta.start_time";
// Temporarily disabled per product requirement; keep code path for future re-enable.
const ENABLE_START_TIME_FILTER = false;

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((entry) => String(entry ?? "").trim()).filter(Boolean);
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue ? [normalizedValue] : [];
};

const toDateOrUndefined = (value?: string) => {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : new Date(parsed);
};

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

export const MediaLibraryListHeader: React.FC<Props> = observer(({ layouts = DEFAULT_LAYOUTS }) => {
  const { isMobile } = usePlatformOS();
  const { openUpload, mediaFilters } = useMediaLibrary();
  const { loader } = useProject();

  const { workspaceSlug, projectId } = useParams() as {
    workspaceSlug: string;
    projectId: string;
  };

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [isTemporalFiltersOpen, setIsTemporalFiltersOpen] = useState(false);
  const temporalFiltersRef = useRef<HTMLDivElement | null>(null);
  const activeLayout = useMemo(() => {
    const viewParam = searchParams.get("view");
    return viewParam === MediaLayoutTypes.LIST ? MediaLayoutTypes.LIST : MediaLayoutTypes.GRID;
  }, [searchParams]);
  const normalizedLayouts = useMemo(
    () => layouts.filter((layout) => Object.values(MediaLayoutTypes).includes(layout.key)),
    [layouts]
  );
  const hasFilterOptions =
    mediaFilters.configManager.allAvailableConfigs.length > 0 || mediaFilters.allConditionsForDisplay.length > 0;
  const startDateCondition = mediaFilters.allConditionsForDisplay.find(
    (condition) => condition.property === START_DATE_FILTER_PROPERTY && condition.operator === COMPARISON_OPERATOR.RANGE
  );
  const startDateValues = toStringArray(startDateCondition?.value).slice(0, 2);
  const startDateFrom = toDateOrUndefined(startDateValues[0]);
  const startDateTo = toDateOrUndefined(startDateValues[1]);
  const startTimeCondition = mediaFilters.allConditionsForDisplay.find(
    (condition) => condition.property === START_TIME_FILTER_PROPERTY && condition.operator === COMPARISON_OPERATOR.RANGE
  );
  const startTimeValues = toStringArray(startTimeCondition?.value).slice(0, 2);
  const startTimeFrom = startTimeValues[0] ?? null;
  const startTimeTo = startTimeValues[1] ?? null;

  /* ------------------------------------------------------------------ */
  /* SYNC QUERY */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const nextQuery = searchParams.get("q") ?? "";
    setQuery(nextQuery);
    setDebouncedQuery(nextQuery);
  }, [searchParams]);

  const updateQuery = useCallback(
    (key: string, value?: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) params.set(key, value);
      else params.delete(key);

      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    const currentQuery = searchParams.get("q") ?? "";
    if (debouncedQuery !== currentQuery) {
      updateQuery("q", debouncedQuery);
    }
  }, [debouncedQuery, searchParams, updateQuery]);

  useEffect(() => {
    if (ENABLE_START_TIME_FILTER) return;

    const startTimeConditions = mediaFilters.allConditionsForDisplay.filter(
      (condition) => condition.property === START_TIME_FILTER_PROPERTY
    );

    if (!startTimeConditions.length) return;

    for (const condition of startTimeConditions) {
      mediaFilters.removeCondition(condition.id);
    }
  }, [mediaFilters, mediaFilters.allConditionsForDisplay]);

  useEffect(() => {
    if (!isTemporalFiltersOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!temporalFiltersRef.current?.contains(target)) {
        setIsTemporalFiltersOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isTemporalFiltersOpen]);

  const handleLayoutChange = (layout: MediaLayoutTypes) => {
    updateQuery("view", layout);
  };

  const upsertTemporalRangeCondition = useCallback(
    (property: string, values: Array<string | null | undefined>) => {
      const normalizedValues = values.map((value) => String(value ?? "").trim()).filter(Boolean);
      const propertyConditions = mediaFilters.allConditionsForDisplay.filter(
        (condition) => condition.property === property
      );
      const rangeCondition = propertyConditions.find((condition) => condition.operator === COMPARISON_OPERATOR.RANGE);

      for (const condition of propertyConditions) {
        if (!rangeCondition || condition.id !== rangeCondition.id) {
          mediaFilters.removeCondition(condition.id);
        }
      }

      if (normalizedValues.length === 0) {
        if (rangeCondition) mediaFilters.removeCondition(rangeCondition.id);
        return;
      }

      if (rangeCondition) {
        mediaFilters.updateConditionValue(rangeCondition.id, normalizedValues);
        return;
      }

      mediaFilters.addCondition(
        LOGICAL_OPERATOR.AND,
        {
          property,
          operator: COMPARISON_OPERATOR.RANGE,
          value: normalizedValues,
        },
        false
      );
    },
    [mediaFilters]
  );

  /* ------------------------------------------------------------------ */
  /* RENDER */
  /* ------------------------------------------------------------------ */

  return (
    <Header className="relative">
      {/* LEFT */}
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug} projectId={projectId} />
          <Breadcrumbs.Item component={<BreadcrumbLink label="Media Library" isLast />} />
        </Breadcrumbs>
      </Header.LeftItem>

      {/* CENTER SEARCH */}
      <div className="pointer-events-auto absolute left-1/2 top-1/2 w-full max-w-[180px] -translate-x-1/2 -translate-y-1/2 md:max-w-[220px] lg:max-w-[280px] xl:max-w-[320px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-custom-text-300" />
          <input
            type="text"
            placeholder="Search media"
            className="h-8 w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-8 text-left text-xs text-custom-text-100 placeholder:text-custom-text-300 focus:outline-none"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDebouncedQuery("");
                updateQuery("q");
              }}
              aria-label="Clear search"
              title="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-custom-text-300 hover:text-custom-text-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <Header.RightItem>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden 3xl:flex items-center gap-1 rounded bg-custom-background-80 p-1">
            <DateRangeDropdown
              value={{ from: startDateFrom, to: startDateTo }}
              onSelect={(range) => {
                const from = range?.from ? renderFormattedPayloadDate(range.from) : null;
                const to = range?.to ? renderFormattedPayloadDate(range.to) : null;
                upsertTemporalRangeCondition(START_DATE_FILTER_PROPERTY, [from, to]);
              }}
              mergeDates
              renderPlaceholder
              placeholder={{ from: "From", to: "To" }}
              hideIcon={{ from: false, to: true }}
              usePointerOutsideClick
              buttonVariant="transparent-with-text"
              buttonClassName="h-7 rounded px-2 text-xs"
              buttonContainerClassName="w-[180px]"
              clearIconClassName="h-3.5 w-3.5"
              isClearable
            />
          </div>
          {ENABLE_START_TIME_FILTER ? (
            <div className="hidden 3xl:flex items-center gap-1 rounded bg-custom-background-80 p-1">
              <TimeDropdown
                value={startTimeFrom}
                onChange={(value) => {
                  upsertTemporalRangeCondition(START_TIME_FILTER_PROPERTY, [value, startTimeTo]);
                }}
                placeholder="From"
                useNativePicker
                buttonVariant="transparent-with-text"
                buttonClassName="h-7 rounded px-2 text-xs"
                buttonContainerClassName="w-[90px]"
                icon={<Clock3 size={14} className="h-3.5 w-3.5 flex-shrink-0" />}
              />
              <span className="text-custom-text-300">-</span>
              <TimeDropdown
                value={startTimeTo}
                onChange={(value) => {
                  upsertTemporalRangeCondition(START_TIME_FILTER_PROPERTY, [startTimeFrom, value]);
                }}
                placeholder="To"
                useNativePicker
                buttonVariant="transparent-with-text"
                buttonClassName="h-7 rounded px-2 text-xs"
                buttonContainerClassName="w-[90px]"
                hideIcon
              />
            </div>
          ) : null}
          <div ref={temporalFiltersRef} className="relative 3xl:hidden">
            <Button
              variant="neutral-primary"
              size="sm"
              className="gap-1 px-2 xl:px-3"
              onClick={() => {
                setIsTemporalFiltersOpen((prev) => !prev);
              }}
            >
              <CalendarClock size={14} className="h-3.5 w-3.5" />
              <span className="hidden xl:inline">{ENABLE_START_TIME_FILTER ? "Time filters" : "Date filter"}</span>
              <ChevronDown
                size={14}
                className={`hidden h-3.5 w-3.5 transition-transform xl:block ${isTemporalFiltersOpen ? "rotate-180" : ""}`}
              />
            </Button>
            {isTemporalFiltersOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-md border border-custom-border-200 bg-custom-background-100 p-3 shadow-custom-shadow-rg">
                <div className="text-[11px] font-medium text-custom-text-300">Start date</div>
                <div className="mt-1">
                  <DateRangeDropdown
                    value={{ from: startDateFrom, to: startDateTo }}
                    onSelect={(range) => {
                      const from = range?.from ? renderFormattedPayloadDate(range.from) : null;
                      const to = range?.to ? renderFormattedPayloadDate(range.to) : null;
                      upsertTemporalRangeCondition(START_DATE_FILTER_PROPERTY, [from, to]);
                    }}
                    mergeDates
                    renderPlaceholder
                    placeholder={{ from: "From", to: "To" }}
                    usePointerOutsideClick
                    buttonVariant="transparent-with-text"
                    buttonClassName="h-8 rounded border border-custom-border-200 px-2 text-xs"
                    buttonContainerClassName="w-full text-left"
                    clearIconClassName="h-3.5 w-3.5"
                    isClearable
                  />
                </div>
                {ENABLE_START_TIME_FILTER ? (
                  <>
                    <div className="mt-3 text-[11px] font-medium text-custom-text-300">Start time</div>
                    <div className="mt-1 flex items-center gap-2">
                      <TimeDropdown
                        value={startTimeFrom}
                        onChange={(value) => {
                          upsertTemporalRangeCondition(START_TIME_FILTER_PROPERTY, [value, startTimeTo]);
                        }}
                        placeholder="From"
                        useNativePicker
                        buttonVariant="transparent-with-text"
                        buttonClassName="h-8 rounded border border-custom-border-200 px-2 text-xs"
                        buttonContainerClassName="w-full text-left"
                        hideIcon
                      />
                      <span className="text-custom-text-300">-</span>
                      <TimeDropdown
                        value={startTimeTo}
                        onChange={(value) => {
                          upsertTemporalRangeCondition(START_TIME_FILTER_PROPERTY, [startTimeFrom, value]);
                        }}
                        placeholder="To"
                        useNativePicker
                        buttonVariant="transparent-with-text"
                        buttonClassName="h-8 rounded border border-custom-border-200 px-2 text-xs"
                        buttonContainerClassName="w-full text-left"
                        hideIcon
                      />
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
          {/* Layout Toggle */}
          <div className="flex items-center gap-1 rounded bg-custom-background-80 p-1">
            {normalizedLayouts.map((layout) => (
              <Tooltip key={layout.key} tooltipContent={layout.i18n_title} isMobile={isMobile}>
                <button
                  type="button"
                  onClick={() => handleLayoutChange(layout.key)}
                  aria-label={`${layout.i18n_title} view`}
                  className={`grid h-[22px] w-7 place-items-center rounded transition ${
                    activeLayout === layout.key
                      ? "bg-custom-background-100 shadow-custom-shadow-2xs"
                      : "hover:bg-custom-background-100"
                  }`}
                >
                  {layout.key === MediaLayoutTypes.GRID ? (
                    <LayoutGrid size={14} strokeWidth={2} className="text-custom-text-100" />
                  ) : (
                    <List size={14} strokeWidth={2} className="text-custom-text-100" />
                  )}
                </button>
              </Tooltip>
            ))}
          </div>
          {hasFilterOptions ? <FiltersToggle filter={mediaFilters} /> : null}
          {/* Upload */}
          <Button variant="primary" size="sm" className="gap-1.5 px-2 lg:px-3" onClick={openUpload}>
            <Upload size={16} className="h-3.5 w-3.5" />
            <span className="hidden lg:inline">Upload</span>
          </Button>
        </div>
      </Header.RightItem>
    </Header>
  );
});
