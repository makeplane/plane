"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, ChevronDown, Clock3, LayoutGrid, List, ListFilter, Search, Upload, X } from "lucide-react";

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
import { useMediaLibrary } from "../store/media-library-context";

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

type TUpdateQueryOptions = {
  resetPagination?: boolean;
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
const LEGACY_QUERY_PARAM_KEY = "q";
const LEGACY_VIEW_PARAM_KEY = "view";
const MAIN_QUERY_PARAM_KEY = "q_main";
const SECTION_QUERY_PARAM_KEY = "q_section";
const MAIN_VIEW_PARAM_KEY = "view_main";
const SECTION_VIEW_PARAM_KEY = "view_section";
const MAIN_GROUP_PARAM_KEY = "group_main";
const GROUPED_MEDIA_GROUP_VALUE = "grouped";
const SECTION_PATH_SEGMENT = "/media-library/section/";
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

const useDebouncedValue = (value: string, delayMs: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(handle);
  }, [delayMs, value]);

  return debouncedValue;
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
  const isSectionScope = useMemo(() => pathname.includes(SECTION_PATH_SEGMENT), [pathname]);
  const activeQueryParamKey = isSectionScope ? SECTION_QUERY_PARAM_KEY : MAIN_QUERY_PARAM_KEY;
  const activeViewParamKey = isSectionScope ? SECTION_VIEW_PARAM_KEY : MAIN_VIEW_PARAM_KEY;

  const queryParam = searchParams.get(activeQueryParamKey) ?? "";
  const [query, setQuery] = useState(queryParam);
  const debouncedQuery = useDebouncedValue(query, 300);
  const [isTemporalFiltersOpen, setIsTemporalFiltersOpen] = useState(false);
  const temporalFiltersRef = useRef<HTMLDivElement | null>(null);
  const previousActiveQueryParamKeyRef = useRef(activeQueryParamKey);
  const pendingQuerySyncRef = useRef<Map<string, Set<string>>>(new Map());
  const activeLayout = useMemo(() => {
    const viewParam = searchParams.get(activeViewParamKey);
    return viewParam === MediaLayoutTypes.LIST ? MediaLayoutTypes.LIST : MediaLayoutTypes.GRID;
  }, [activeViewParamKey, searchParams]);
  const isAllMediaView = searchParams.get(MAIN_GROUP_PARAM_KEY) !== GROUPED_MEDIA_GROUP_VALUE;
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
    const normalizedQueryParam = queryParam.trim();
    const pendingValues = pendingQuerySyncRef.current.get(activeQueryParamKey);
    if (pendingValues?.has(normalizedQueryParam)) {
      pendingValues.delete(normalizedQueryParam);
      if (!pendingValues.size) pendingQuerySyncRef.current.delete(activeQueryParamKey);
      return;
    }

    setQuery((currentValue) => (currentValue === queryParam ? currentValue : queryParam));
  }, [activeQueryParamKey, queryParam]);

  const updateSearchParam = useCallback(
    (key: string, value?: string, options?: TUpdateQueryOptions) => {
      const params = new URLSearchParams(searchParams.toString());
      const normalizedValue = (value ?? "").trim();

      if (normalizedValue) params.set(key, normalizedValue);
      else params.delete(key);

      if (options?.resetPagination) {
        params.delete("page");
        params.delete("cursor");
      }
      params.delete(LEGACY_QUERY_PARAM_KEY);
      params.delete(LEGACY_VIEW_PARAM_KEY);

      const nextQueryString = params.toString();
      const currentQueryString = searchParams.toString();
      if (nextQueryString === currentQueryString) return;

      router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const didQueryScopeChange = previousActiveQueryParamKeyRef.current !== activeQueryParamKey;
    if (didQueryScopeChange) return;
    const normalizedDebouncedQuery = debouncedQuery.trim();
    const normalizedCurrentQuery = query.trim();
    if (normalizedDebouncedQuery !== normalizedCurrentQuery) return;
    if (normalizedDebouncedQuery === queryParam) return;
    const pendingValues = pendingQuerySyncRef.current.get(activeQueryParamKey) ?? new Set<string>();
    pendingValues.add(normalizedDebouncedQuery);
    pendingQuerySyncRef.current.set(activeQueryParamKey, pendingValues);
    updateSearchParam(activeQueryParamKey, normalizedDebouncedQuery, { resetPagination: true });
  }, [activeQueryParamKey, debouncedQuery, query, queryParam, updateSearchParam]);

  useEffect(() => {
    previousActiveQueryParamKeyRef.current = activeQueryParamKey;
  }, [activeQueryParamKey]);

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
    updateSearchParam(activeViewParamKey, layout);
  };
  const handleGroupModeToggle = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (isAllMediaView) {
      params.set(MAIN_GROUP_PARAM_KEY, GROUPED_MEDIA_GROUP_VALUE);
    } else {
      params.delete(MAIN_GROUP_PARAM_KEY);
    }

    params.delete(LEGACY_QUERY_PARAM_KEY);
    params.delete(LEGACY_VIEW_PARAM_KEY);
    params.delete("page");
    params.delete("cursor");

    const nextQueryString = params.toString();
    const currentQueryString = searchParams.toString();
    if (nextQueryString === currentQueryString) return;

    router.replace(nextQueryString ? `${pathname}?${nextQueryString}` : pathname);
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
    <Header className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 sm:grid-cols-[minmax(120px,0.65fr)_minmax(120px,1fr)_auto]">
      {/* LEFT */}
      <Header.LeftItem className="min-w-0 max-w-none flex-none overflow-hidden">
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug} projectId={projectId} />
          <Breadcrumbs.Item component={<BreadcrumbLink label="Media Library" isLast />} />
        </Breadcrumbs>
      </Header.LeftItem>

      {/* CENTER SEARCH */}
      <div className="pointer-events-auto hidden min-w-0 sm:block">
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
                const pendingValues = pendingQuerySyncRef.current.get(activeQueryParamKey) ?? new Set<string>();
                pendingValues.add("");
                pendingQuerySyncRef.current.set(activeQueryParamKey, pendingValues);
                updateSearchParam(activeQueryParamKey, "", { resetPagination: true });
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
      <Header.RightItem className="min-w-0 shrink-0 items-center gap-1">
        <div className="flex min-w-0 items-center gap-1 @lg:gap-1.5">
          <div className="hidden 3xl:flex items-center gap-1 border border-custom-border-200 rounded bg-custom-background-100 px-0">
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
              className="gap-1 px-2 @4xl:px-3"
              onClick={() => {
                setIsTemporalFiltersOpen((prev) => !prev);
              }}
            >
              <CalendarClock size={14} className="h-3.5 w-3.5" />
              <span className="hidden @4xl:inline">{ENABLE_START_TIME_FILTER ? "Time filters" : "Date filter"}</span>
              <ChevronDown
                size={14}
                className={`hidden h-3.5 w-3.5 transition-transform @4xl:block ${isTemporalFiltersOpen ? "rotate-180" : ""}`}
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
          {!isSectionScope ? (
            <Tooltip tooltipContent={isAllMediaView ? "Group by category" : "Show all media"} isMobile={isMobile}>
              <Button
                variant="neutral-primary"
                size="sm"
                className="min-w-0 gap-1 px-2 @4xl:px-3"
                onClick={handleGroupModeToggle}
                aria-label={isAllMediaView ? "Group by category" : "Show all media"}
              >
                <ListFilter size={14} className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="hidden max-w-[90px] truncate @4xl:inline">
                  {isAllMediaView ? "By category" : "All media"}
                </span>
              </Button>
            </Tooltip>
          ) : null}
          <div className="flex flex-shrink-0 items-center gap-1 rounded bg-custom-background-80 p-1">
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
          <Button variant="primary" size="sm" className="gap-1.5 px-2 @4xl:px-3" onClick={openUpload}>
            <Upload size={16} className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="hidden @4xl:inline">Upload</span>
          </Button>
        </div>
      </Header.RightItem>
    </Header>
  );
});
