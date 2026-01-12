"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {  LayoutGrid, List, Search, Upload, X } from "lucide-react";

// UI
import { Button } from "@plane/propel/button";
import { Breadcrumbs, Header, Tooltip } from "@plane/ui";

// Components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { FiltersToggle } from "@/components/rich-filters/filters-toggle";


// Hooks
import { useProject } from "@/hooks/store/use-project";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
import { useMediaLibrary } from "./media-library-context";


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

/* ------------------------------------------------------------------ */
/* COMPONENT */
/* ------------------------------------------------------------------ */

export const MediaLibraryListHeader: React.FC<Props> = observer(({
  layouts = DEFAULT_LAYOUTS,
}) => {
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
  const mediaType = searchParams.get("mediaType") ?? "";
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

  const handleLayoutChange = (layout: MediaLayoutTypes) => {
    updateQuery("view", layout);
  };

  /* ------------------------------------------------------------------ */
  /* RENDER */
  /* ------------------------------------------------------------------ */

  return (
    <Header className="relative">
      {/* LEFT */}
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
          <Breadcrumbs.Item
            component={<BreadcrumbLink label="Media Library" isLast />}
          />
        </Breadcrumbs>
      </Header.LeftItem>

      {/* CENTER SEARCH */}
      <div className="pointer-events-auto absolute left-1/2 top-1/2 w-[320px] -translate-x-1/2 -translate-y-1/2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-custom-text-300" />
          <input
            type="text"
            placeholder="Search media"
            className="h-8 w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-8 text-center text-xs text-custom-text-100 placeholder:text-custom-text-300 focus:outline-none"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-custom-text-300 hover:text-custom-text-100"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* RIGHT */}
      <Header.RightItem>
        <div className="flex items-center gap-2">
          {/* Layout Toggle */}
          <div className="flex items-center gap-1 rounded bg-custom-background-80 p-1">
            {normalizedLayouts.map((layout) => (
              <Tooltip
                key={layout.key}
                tooltipContent={layout.i18n_title}
                isMobile={isMobile}
              >
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
                    <List  size={14} strokeWidth={2} className="text-custom-text-100" />
                  )}
                </button>
              </Tooltip>
            ))}
          </div>
          {hasFilterOptions ? <FiltersToggle filter={mediaFilters} /> : null}
          <select
            aria-label="Filter by media type"
            value={mediaType}
            onChange={(event) => updateQuery("mediaType", event.target.value)}
            className="h-7 rounded-md border border-custom-border-200 bg-custom-background-100 px-2 text-xs text-custom-text-100 focus:outline-none focus:ring-0 focus:border-custom-border-200"
          >
            <option value="">All types</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="hls">HLS</option>
            <option value="document">Document</option>
          </select>
           {/* Upload */}
          <Button
            variant="primary"
            size="sm"
            className="gap-1.5"
            onClick={openUpload}
          >
            <Upload size={16} className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </Header.RightItem>
    </Header>
  );
});
