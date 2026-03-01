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
import { cn, CustomMenu, Input, Loader } from "@plane/ui";
import { useParams } from "react-router";
import { useRouter } from "next/navigation";
// hooks
import { useRunners } from "@/hooks/store/runners/use-runners";
// components
import { TableHead, Table, TableRow, TableHeader, TableBody, TableCell } from "@plane/propel/table";
import { Pencil, Search, Trash2 } from "lucide-react";
import { DeleteRunnerModal } from "./delete-runner-modal";
import { calculateTimeAgo } from "@plane/utils";
import { Button } from "@plane/propel/button";
import type { RunnerScript } from "@plane/types";
import { EmptyStateCompact } from "@plane/propel/empty-state";

const COMMON_TABLE_HEADER_CLASSNAME = "";
const COMMON_TABLE_CELL_CLASSNAME = "text-secondary border-b border-subtle w-[100px]";
const COMMON_TABLE_TITLE_CELL_CLASSNAME =
  "w-full font-medium text-primary truncate left-0 bg-surface-1 transition-colors duration-75 py-3 border-b border-subtle";

export const RunnersDashboard = observer(() => {
  const { workspaceSlug } = useParams();
  const router = useRouter();
  const { isLoading, getScriptsByWorkspaceSlug } = useRunners();
  const [searchQuery, setSearchQuery] = useState("");
  const [scriptToDelete, setScriptToDelete] = useState<string | null>(null);
  // derived values
  const scripts = workspaceSlug && getScriptsByWorkspaceSlug(workspaceSlug);

  const MENU_ITEMS = [
    {
      label: "Edit",
      icon: <Pencil className="flex-shrink-0 size-3.5" />,
      onClick: (scriptId: string) => {
        router.push(`/${workspaceSlug}/settings/runner/scripts/${scriptId}`);
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="flex-shrink-0 size-3.5" />,
      onClick: (scriptId: string) => {
        setScriptToDelete(scriptId);
      },
    },
  ];

  // Filter functions based on search and category
  const filterScripts = (scripts: RunnerScript[]) => {
    return scripts.filter((script) => {
      const matchesSearch = !searchQuery || script.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  const filteredScripts = scripts ? filterScripts(scripts) : [];
  if (scripts?.length === 0 && !isLoading) {
    return (
      <EmptyStateCompact
        assetKey="runner-scripts"
        title="No scripts found"
        description="Create your first script to get started"
        align="start"
        rootClassName="py-20"
        actions={[
          {
            label: "Create Script",
            onClick: () => router.push(`/${workspaceSlug}/settings/runner/scripts/new`),
          },
        ]}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-h6-medium text-primary">Scripts</div>
            <div className="text-body-xs-regular text-secondary">Automate your workflows with custom scripts.</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 border border-subtle-1 rounded-md px-2 h-7">
              <Search className="size-3 text-icon-tertiary" />
              <Input
                placeholder="Search scripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="p-0 border-none bg-transparent"
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => router.push(`/${workspaceSlug}/settings/runner/scripts/new`)}
            >
              <span>New Script</span>
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
        ) : filteredScripts.length > 0 ? (
          <Table className="table-fixed">
            <TableHeader className="border-t-0 border-subtle py-4">
              <TableRow>
                <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME)}>Name </TableHead>
                <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "w-[150px]")}>Executions </TableHead>
                <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "w-[150px]")}>Success Rate </TableHead>
                <TableHead className={cn(COMMON_TABLE_HEADER_CLASSNAME, "w-[150px]")}>Last Run </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScripts.map((script) => (
                <TableRow key={script.id} className="group cursor-pointer transition-colors duration-75">
                  <TableCell className={cn(COMMON_TABLE_TITLE_CELL_CLASSNAME)}>
                    <div className="flex items-center gap-2.5 w-full min-w-0">
                      <div className="truncate font-medium" title={script.name}>
                        {script.name}
                      </div>
                      <CustomMenu
                        ellipsis
                        buttonClassName="p-0.5 text-icon-tertiary"
                        optionsClassName="p-1.5"
                        placement="bottom-end"
                      >
                        {MENU_ITEMS.map((item) => (
                          <CustomMenu.MenuItem key={item.label} onClick={() => item.onClick(script.id)}>
                            <div className="flex items-center gap-x-2 cursor-pointer font-medium">
                              <div> {item.icon} </div>
                              <div> {item.label} </div>
                            </div>
                          </CustomMenu.MenuItem>
                        ))}
                      </CustomMenu>
                    </div>
                  </TableCell>

                  <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>{script.total_executions ?? 0}</TableCell>
                  <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                    {script.success_rate != null ? (
                      <div
                        className={cn(
                          "rounded-sm p-1 w-fit text-caption-sm-medium",
                          script.success_rate > 50
                            ? "bg-success-subtle-1 text-success-primary"
                            : "bg-danger-subtle text-danger-primary"
                        )}
                      >
                        {script.success_rate}%
                      </div>
                    ) : (
                      <span className="text-secondary">-</span>
                    )}
                  </TableCell>
                  <TableCell className={COMMON_TABLE_CELL_CLASSNAME}>
                    {script.last_run ? calculateTimeAgo(script.last_run) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyStateCompact
            assetKey="runner-scripts"
            title="No matching scripts found"
            description="Try adjusting your search or filters"
            align="start"
            rootClassName="py-20"
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {workspaceSlug && (
        <DeleteRunnerModal
          isOpen={!!scriptToDelete}
          onClose={() => setScriptToDelete(null)}
          workspaceSlug={workspaceSlug}
          scriptId={scriptToDelete}
        />
      )}
    </>
  );
});
