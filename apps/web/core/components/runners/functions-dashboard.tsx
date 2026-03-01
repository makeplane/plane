/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { Lock, Pencil, Trash2, Search, Eye, ChevronDownIcon } from "lucide-react";
import useSWR from "swr";
// types
import type { ScriptFunction, FunctionCategory } from "@plane/types";
// ui
import { cn, CustomMenu, Loader, Input, Tooltip } from "@plane/ui";
import { TableHead, Table, TableRow, TableHeader, TableBody, TableCell } from "@plane/propel/table";
// hooks
import { useFunctions } from "@/hooks/store/runners/use-functions";
// components
import { DeleteFunctionModal } from "./delete-function-modal";
import { ViewFunctionModal } from "./function-browser/view-function-modal";
import { Button } from "@plane/propel/button";
import { Combobox } from "@plane/propel/combobox";
import { EmptyStateCompact } from "@plane/propel/empty-state";

const CATEGORY_COLORS: Record<FunctionCategory, string> = {
  http: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  notifications: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  data: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  utils: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  custom: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};
const CATEGORY_OPTIONS: (FunctionCategory | "all")[] = ["all", "http", "notifications", "data", "utils", "custom"];
const COMMON_TABLE_HEADER_CLASSNAME = "";
const COMMON_TABLE_CELL_CLASSNAME = "text-secondary border-b border-subtle";

export const FunctionsDashboard = observer(() => {
  const { workspaceSlug } = useParams();
  const router = useRouter();
  const { isLoading, fetchFunctions, getSystemFunctions, getWorkspaceFunctions, getFunctionById } = useFunctions();
  const [functionToDelete, setFunctionToDelete] = useState<string | null>(null);
  const [functionToView, setFunctionToView] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<FunctionCategory | "all">("all");

  // Fetch functions on mount
  useSWR(
    workspaceSlug ? `FUNCTIONS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchFunctions(workspaceSlug) : null
  );

  // derived values
  const systemFunctions = getSystemFunctions(workspaceSlug);
  const workspaceFunctions = getWorkspaceFunctions(workspaceSlug);

  // Filter functions based on search and category
  const filterFunctions = (functions: ScriptFunction[]) => {
    return functions.filter((fn: ScriptFunction) => {
      if (!fn) return false;
      const matchesSearch =
        !searchQuery ||
        fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fn.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || fn.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  const filteredSystemFunctions = filterFunctions(systemFunctions);
  const filteredWorkspaceFunctions = filterFunctions(workspaceFunctions);
  const hasNoFunctions = systemFunctions.length === 0 && workspaceFunctions.length === 0;
  const hasNoFilteredResults = filteredSystemFunctions.length === 0 && filteredWorkspaceFunctions.length === 0;

  if (hasNoFunctions && !isLoading) {
    return (
      <EmptyStateCompact
        assetKey="runner-functions"
        title="No functions available"
        description="Create your first function to get started"
        align="start"
        rootClassName="py-20"
        actions={[
          {
            label: "Create Function",
            onClick: () => router.push(`/${workspaceSlug}/settings/runner/functions/new`),
          },
        ]}
      />
    );
  }

  const renderFunctionRow = (fn: ScriptFunction, isSystem: boolean) => (
    <TableRow key={fn.id} className="group cursor-pointer transition-colors duration-75 hover:bg-layer-2">
      <TableCell className={cn(COMMON_TABLE_CELL_CLASSNAME, "py-3")}>
        <div className="flex items-center gap-2.5 w-full min-w-0">
          {isSystem && <Lock className="size-3.5 text-icon-tertiary flex-shrink-0" />}
          <div className="truncate font-medium text-primary" title={fn.name}>
            {fn.name}
          </div>
          <CustomMenu
            ellipsis
            buttonClassName="p-0.5 text-icon-tertiary opacity-0 group-hover:opacity-100"
            optionsClassName="p-1.5"
            placement="bottom-end"
          >
            <CustomMenu.MenuItem onClick={() => setFunctionToView(fn.id)}>
              <div className="flex items-center gap-x-2 cursor-pointer font-medium">
                <Eye className="flex-shrink-0 size-3.5" />
                <span>View</span>
              </div>
            </CustomMenu.MenuItem>
            {!isSystem && (
              <>
                <CustomMenu.MenuItem
                  onClick={() => router.push(`/${workspaceSlug}/settings/runner/functions/${fn.id}`)}
                >
                  <div className="flex items-center gap-x-2 cursor-pointer font-medium">
                    <Pencil className="flex-shrink-0 size-3.5" />
                    <span>Edit</span>
                  </div>
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={() => setFunctionToDelete(fn.id)}>
                  <div className="flex items-center gap-x-2 cursor-pointer font-medium text-danger-primary">
                    <Trash2 className="flex-shrink-0 size-3.5" />
                    <span>Delete</span>
                  </div>
                </CustomMenu.MenuItem>
              </>
            )}
          </CustomMenu>
        </div>
      </TableCell>
      <TableCell className={cn(COMMON_TABLE_CELL_CLASSNAME, "py-3")}>
        <span className="text-secondary text-sm line-clamp-1">{fn.description}</span>
      </TableCell>
      <TableCell className={cn(COMMON_TABLE_CELL_CLASSNAME, "py-3 w-[120px]")}>
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
            CATEGORY_COLORS[fn.category] || CATEGORY_COLORS.custom
          )}
        >
          {fn.category}
        </span>
      </TableCell>
      <TableCell className={cn(COMMON_TABLE_CELL_CLASSNAME, "py-3 w-[150px]")}>
        <span className="text-secondary text-sm">{fn.parameters.length} params</span>
      </TableCell>
    </TableRow>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-h6-medium text-primary">Functions</div>
            <div className="text-body-xs-regular text-secondary">Define functions to be used in scripts.</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border border-subtle-1 rounded-md px-2 h-7">
              <Search className="size-3 text-icon-tertiary" />
              <Input
                placeholder="Search functions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-0 border-none bg-transparent"
              />
            </div>
            <Combobox
              value={categoryFilter}
              onValueChange={(val) => setCategoryFilter(val as FunctionCategory | "all")}
            >
              <Tooltip tooltipContent="Select the category of the function." position="top">
                <Combobox.Button
                  className={cn(
                    "flex items-center gap-1 rounded-lg h-[28px] px-2 bg-layer-2 border border-subtle-1 overflow-hidden hover:bg-surface-1 hover:shadow-raised-100 shrink-0"
                  )}
                >
                  <span className="capitalize text-body-xs-medium truncate text-primary">{categoryFilter}</span>
                  <ChevronDownIcon className="size-4 text-icon-secondary" />
                </Combobox.Button>
              </Tooltip>
              <Combobox.Options className="max-h-[70vh] overflow-y-auto" maxHeight="lg">
                {CATEGORY_OPTIONS.map((option) => (
                  <Combobox.Option
                    key={option}
                    value={option}
                    className="capitalize text-13 text-secondary font-medium flex w-full items-center gap-2 data-[highlighted]:bg-layer-transparent-hover"
                  >
                    <span className="text-13 truncate">{option}</span>
                  </Combobox.Option>
                ))}
              </Combobox.Options>
            </Combobox>
            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(`/${workspaceSlug}/settings/runner/functions/new`)}
            >
              <span>New Function</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader className="mx-auto w-full space-y-4">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          </div>
        ) : hasNoFilteredResults ? (
          <EmptyStateCompact
            assetKey="runner-functions"
            title="No matching functions"
            description="Try adjusting your search or filters"
            align="start"
            rootClassName="py-20"
          />
        ) : (
          <>
            {/* System Functions */}
            {filteredSystemFunctions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-tertiary uppercase tracking-wide">
                  System Functions ({filteredSystemFunctions.length})
                </h3>
                <Table className="table-fixed">
                  <TableHeader className="border-t-0 border-subtle py-4">
                    <TableRow>
                      <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME)}>Name</TableHead>
                      <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME)}>Description</TableHead>
                      <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "w-[120px]")}>Category</TableHead>
                      <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "w-[150px]")}>Parameters</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{filteredSystemFunctions.map((fn) => renderFunctionRow(fn, true))}</TableBody>
                </Table>
              </div>
            )}

            {/* Workspace Functions */}
            <div className="space-y-2">
              {filteredWorkspaceFunctions.length > 0 ? (
                <Table className="table-fixed">
                  <TableHeader className="border-t-0 border-subtle py-4">
                    <TableRow>
                      <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME)}>Name</TableHead>
                      <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME)}>Description</TableHead>
                      <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "w-[120px]")}>Category</TableHead>
                      <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "w-[150px]")}>Parameters</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>{filteredWorkspaceFunctions.map((fn) => renderFunctionRow(fn, false))}</TableBody>
                </Table>
              ) : (
                <div className="py-8 text-center border border-dashed border-subtle rounded-lg">
                  <EmptyStateCompact
                    assetKey="runner-functions"
                    title="No workspace functions yet"
                    description="Create a custom function to reuse in your scripts"
                    align="start"
                    rootClassName="py-20"
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {workspaceSlug && (
        <DeleteFunctionModal
          isOpen={!!functionToDelete}
          onClose={() => setFunctionToDelete(null)}
          workspaceSlug={workspaceSlug}
          functionId={functionToDelete}
        />
      )}

      {/* View Function Modal */}
      <ViewFunctionModal
        isOpen={!!functionToView}
        onClose={() => setFunctionToView(null)}
        functionData={functionToView ? (getFunctionById(functionToView) ?? null) : null}
      />
    </>
  );
});
