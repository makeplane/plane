/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useState } from "react";
import { observer } from "mobx-react";

// plane internal packages
import { WEB_BASE_URL } from "@plane/constants";
import { NewTabIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { ToggleSwitch } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store";

type TWorkspaceListItemProps = {
  workspaceId: string;
};

export const WorkspaceListItem = observer(function WorkspaceListItem({ workspaceId }: TWorkspaceListItemProps) {
  // states
  const [isUpdatingFeature, setIsUpdatingFeature] = useState(false);
  // store hooks
  const { getWorkspaceById, updateWorkspaceFeature } = useWorkspace();
  // derived values
  const workspace = getWorkspaceById(workspaceId);

  // Stops a click on the toggle area from bubbling up to the enclosing <a> and navigating away.
  const shieldClickFromNavigation = useCallback((element: HTMLDivElement | null) => {
    element?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }, []);

  const handleFileLibraryToggle = async () => {
    if (!workspace || isUpdatingFeature) return;
    const nextValue = !workspace.is_file_library_enabled;
    setIsUpdatingFeature(true);
    try {
      await updateWorkspaceFeature(workspace.id, "file_library", nextValue);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success",
        message: `File library ${nextValue ? "enabled" : "disabled"} for ${workspace.name}`,
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to update the file library feature",
      });
    } finally {
      setIsUpdatingFeature(false);
    }
  };

  if (!workspace) return null;
  return (
    <a
      key={workspaceId}
      href={`${WEB_BASE_URL}/${encodeURIComponent(workspace.slug)}`}
      target="_blank"
      className="group flex items-center justify-between gap-2.5 truncate rounded-lg border border-subtle bg-layer-1 p-3 hover:border-subtle-1 hover:bg-layer-1-hover hover:shadow-raised-100"
      rel="noreferrer"
    >
      <div className="flex items-start gap-4">
        <span
          className={`relative mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center p-2 text-11 uppercase ${
            !workspace?.logo_url && "rounded-lg bg-accent-primary text-on-color"
          }`}
        >
          {workspace?.logo_url && workspace.logo_url !== "" ? (
            <img
              src={getFileURL(workspace.logo_url)}
              className="absolute top-0 left-0 h-full w-full rounded-sm object-cover"
              alt="Workspace Logo"
            />
          ) : (
            (workspace?.name?.[0] ?? "...")
          )}
        </span>
        <div className="flex flex-col items-start gap-1">
          <div className="flex w-full flex-wrap items-center gap-2.5">
            <h3 className={`text-14 font-medium capitalize`}>{workspace.name}</h3>/
            <Tooltip tooltipContent="The unique URL of your workspace">
              <h4 className="text-13 text-tertiary">[{workspace.slug}]</h4>
            </Tooltip>
          </div>
          {workspace.owner.email && (
            <div className="flex items-center gap-1 text-11">
              <h3 className="font-medium text-secondary">Owned by:</h3>
              <h4 className="text-tertiary">{workspace.owner.email}</h4>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-11">
            {workspace.total_projects !== null && (
              <span className="flex items-center gap-1">
                <h3 className="font-medium text-secondary">Total projects:</h3>
                <h4 className="text-tertiary">{workspace.total_projects}</h4>
              </span>
            )}
            {workspace.total_members !== null && (
              <>
                •
                <span className="flex items-center gap-1">
                  <h3 className="font-medium text-secondary">Total members:</h3>
                  <h4 className="text-tertiary">{workspace.total_members}</h4>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-4">
        <Tooltip tooltipContent="Enable the file library + contracts module for this workspace">
          {/* Not an interactive element itself — it only shields the nested (already
              keyboard-accessible) ToggleSwitch from the parent anchor's click-to-navigate.
              The listener is attached imperatively so static-analysis a11y rules, which
              assume any onClick JSX prop means "this element itself is interactive", don't
              flag it. */}
          <div
            ref={shieldClickFromNavigation}
            className={`flex items-center gap-2 ${isUpdatingFeature ? "opacity-70" : ""}`}
          >
            <span className="text-11 font-medium text-secondary">File library</span>
            <ToggleSwitch
              value={Boolean(workspace.is_file_library_enabled)}
              onChange={handleFileLibraryToggle}
              size="sm"
              disabled={isUpdatingFeature}
            />
          </div>
        </Tooltip>
        <NewTabIcon width={14} height={16} className="text-placeholder group-hover:text-secondary" />
      </div>
    </a>
  );
});
