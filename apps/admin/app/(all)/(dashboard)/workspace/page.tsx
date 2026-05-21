/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import useSWR from "swr";
import { Download, Loader as LoaderIcon, Search } from "lucide-react";
// types
import { Button, getButtonStyling } from "@plane/propel/button";
import { setPromiseToast, setToast, TOAST_TYPE } from "@plane/propel/toast";
import { InstanceWorkspaceService } from "@plane/services";
import type { TInstanceConfigurationKeys } from "@plane/types";
import { Loader, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
import { WorkspaceListItem } from "@/components/workspace/list-item";
// hooks
import { useInstance, useWorkspace } from "@/hooks/store";
// types
import type { Route } from "./+types/page";

const WorkspaceManagementPage = observer(function WorkspaceManagementPage(_props: Route.ComponentProps) {
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // store
  const { formattedConfig, fetchInstanceConfigurations, updateInstanceConfigurations } = useInstance();
  const {
    workspaceIds,
    loader: workspaceLoader,
    paginationInfo,
    fetchWorkspaces,
    fetchNextWorkspaces,
  } = useWorkspace();
  // derived values
  const disableWorkspaceCreation = formattedConfig?.DISABLE_WORKSPACE_CREATION ?? "";
  const hasNextPage = paginationInfo?.next_page_results && paginationInfo?.next_cursor !== undefined;

  const handleSearch = useCallback(
    (value: string) => {
      setSearchQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetchWorkspaces(value);
      }, 300);
    },
    [fetchWorkspaces]
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const service = new InstanceWorkspaceService();
      const rows: { Name: string; Slug: string }[] = [];
      let cursor: string | undefined;
      do {
        const data = await service.list({ cursor });
        data.results.forEach((ws) => rows.push({ Name: ws.name, Slug: ws.slug }));
        cursor = data.next_page_results ? data.next_cursor : undefined;
      } while (cursor);
      const XLSX = await import("xlsx");
      const sheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, sheet, "Workspaces");
      XLSX.writeFile(workbook, "workspaces.xlsx");
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Export failed", message: "Failed to export workspaces." });
    } finally {
      setIsExporting(false);
    }
  };

  // fetch data
  useSWR("INSTANCE_CONFIGURATIONS", () => fetchInstanceConfigurations());
  useSWR("INSTANCE_WORKSPACES", () => fetchWorkspaces());

  const updateConfig = async (key: TInstanceConfigurationKeys, value: string) => {
    setIsSubmitting(true);

    const payload = {
      [key]: value,
    };

    const updateConfigPromise = updateInstanceConfigurations(payload);

    setPromiseToast(updateConfigPromise, {
      loading: "Saving configuration",
      success: {
        title: "Success",
        message: () => "Configuration saved successfully",
      },
      error: {
        title: "Error",
        message: () => "Failed to save configuration",
      },
    });

    await updateConfigPromise.finally(() => {
      setIsSubmitting(false);
    });
  };

  return (
    <PageWrapper
      header={{
        title: "Workspaces on this instance",
        description: "See all workspaces and control who can create them.",
      }}
    >
      <div className="space-y-3">
        {formattedConfig ? (
          <div className={cn("w-full flex items-center gap-14 rounded-sm")}>
            <div className="flex grow items-center gap-4">
              <div className="grow">
                <div className="text-16 font-medium pb-1">Prevent anyone else from creating a workspace.</div>
                <div className={cn("font-regular leading-5 text-tertiary text-11")}>
                  Toggling this on will let only you create workspaces. You will have to invite users to new workspaces.
                </div>
              </div>
            </div>
            <div className={`shrink-0 pr-4 ${isSubmitting && "opacity-70"}`}>
              <div className="flex items-center gap-4">
                <ToggleSwitch
                  value={Boolean(parseInt(disableWorkspaceCreation))}
                  onChange={() => {
                    if (Boolean(parseInt(disableWorkspaceCreation)) === true) {
                      void updateConfig("DISABLE_WORKSPACE_CREATION", "0");
                    } else {
                      void updateConfig("DISABLE_WORKSPACE_CREATION", "1");
                    }
                  }}
                  size="sm"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
        ) : (
          <Loader>
            <Loader.Item height="50px" width="100%" />
          </Loader>
        )}
        {workspaceLoader !== "init-loader" ? (
          <>
            <div className="pt-6 flex flex-col gap-3">
              <div className="flex flex-col items-start gap-x-2">
                <div className="flex items-center gap-2 text-16 font-medium">
                  All workspaces on this instance <span className="text-tertiary">• {workspaceIds.length}</span>
                  {workspaceLoader && ["mutation", "pagination"].includes(workspaceLoader) && (
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                  )}
                </div>
                <div className={cn("font-regular leading-5 text-tertiary text-11")}>
                  You can only go to a workspace if you are an Admin or a Member.
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/workspace/bulk-import" className={getButtonStyling("secondary", "base")}>
                  Bulk Create Workspace
                </Link>
                <Link href="/workspace/bulk-assign" className={getButtonStyling("secondary", "base")}>
                  Bulk Assign Workspace
                </Link>
                <Link href="/workspace/bulk-import-projects" className={getButtonStyling("secondary", "base")}>
                  Bulk Import Projects
                </Link>
                <Link href="/workspace/bulk-import-modules" className={getButtonStyling("secondary", "base")}>
                  Bulk Import Modules
                </Link>
                <Button variant="secondary" onClick={() => void handleExport()} disabled={isExporting}>
                  <Download className="w-4 h-4" />
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
                <Link href="/workspace/create" className={getButtonStyling("primary", "base")}>
                  Create workspace
                </Link>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                <input
                  type="text"
                  placeholder="Search workspaces..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-13 rounded-md border border-subtle bg-layer-2 text-primary placeholder:text-tertiary outline-none focus:border-accent-primary"
                />
              </div>
            </div>
            <div className="flex flex-col gap-4 py-2">
              {workspaceIds.length === 0 && workspaceLoader === "loaded" ? (
                <div className="flex flex-col items-center justify-center py-12 text-tertiary text-13">
                  No workspaces match your search.
                </div>
              ) : (
                workspaceIds.map((workspaceId) => <WorkspaceListItem key={workspaceId} workspaceId={workspaceId} />)
              )}
            </div>
            {hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="link"
                  size="lg"
                  onClick={() => void fetchNextWorkspaces()}
                  disabled={workspaceLoader === "pagination"}
                >
                  Load more
                  {workspaceLoader === "pagination" && <LoaderIcon className="w-3 h-3 animate-spin" />}
                </Button>
              </div>
            )}
          </>
        ) : (
          <Loader className="space-y-10 py-8">
            <Loader.Item height="24px" width="20%" />
            <Loader.Item height="92px" width="100%" />
            <Loader.Item height="92px" width="100%" />
            <Loader.Item height="92px" width="100%" />
          </Loader>
        )}
      </div>
    </PageWrapper>
  );
});

// eslint-disable-next-line react-refresh/only-export-components
export const meta: Route.MetaFunction = () => [{ title: "Workspace Management - God Mode" }];

export default WorkspaceManagementPage;
