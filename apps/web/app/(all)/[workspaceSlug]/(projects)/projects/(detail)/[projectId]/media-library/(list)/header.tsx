"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
// ui
import { Button } from "@plane/propel/button";
import { ArrowUpToLine, LayoutGrid, List, Search, X } from "lucide-react";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
import { useMediaLibrary } from "./media-library-context";

export const MediaLibraryListHeader = () => {
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { loader } = useProject();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("view") === "list" ? "list" : "grid";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const { openUpload } = useMediaLibrary();

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateQuery = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return (
    <Header className="relative">
      <Header.LeftItem>
        <Breadcrumbs isLoading={loader === "init-loader"}>
          <CommonProjectBreadcrumbs workspaceSlug={workspaceSlug?.toString() ?? ""} projectId={projectId?.toString() ?? ""} />
          <Breadcrumbs.Item component={<BreadcrumbLink label="Media Library" isLast />} />
        </Breadcrumbs>
      </Header.LeftItem>
      <div className="pointer-events-auto absolute left-1/2 top-1/2 w-[300px] -translate-x-1/2 -translate-y-1/2 sm:w-[400px]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-custom-text-300" />
          <input
            type="text"
            placeholder="Search media"
            className="h-8 w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-8 text-center text-xs text-custom-text-100 placeholder:text-custom-text-300 focus:outline-none"
            value={query}
            onChange={(event) => {
              const nextValue = event.target.value;
              setQuery(nextValue);
              updateQuery("q", nextValue);
            }}
          />
          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                updateQuery("q", "");
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-custom-text-300 hover:text-custom-text-100"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <Header.RightItem>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="primary" size="sm" className="gap-1.5" onClick={openUpload}>
            <ArrowUpToLine className="h-3.5 w-3.5" />
            Upload
          </Button>
          <div className="flex items-center rounded-full border border-custom-border-200 bg-custom-background-90 p-1">
            <button
              type="button"
              onClick={() => updateQuery("view", "grid")}
              aria-label="Grid view"
              className={`rounded-full p-2 transition ${
                viewMode === "grid"
                  ? "bg-custom-background-100 text-custom-text-100 shadow-sm"
                  : "text-custom-text-300 hover:text-custom-text-200"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateQuery("view", "list")}
              aria-label="List view"
              className={`rounded-full p-2 transition ${
                viewMode === "list"
                  ? "bg-custom-background-100 text-custom-text-100 shadow-sm"
                  : "text-custom-text-300 hover:text-custom-text-200"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Header.RightItem>
    </Header>
  );
};
