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

import type { FC } from "react";
import { useMemo, useCallback } from "react";
import useSWR from "swr";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { StateGroupIcon } from "@plane/propel/icons";
import type { ExState } from "@plane/sdk";
import type { IState } from "@plane/types";
import { CustomSearchSelect, Loader } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useSentryIntegration } from "@/plane-web/hooks/store/integrations/use-sentry";
// types
import type { StateMappingFormContentProps } from "./types";

// Helper function to convert IState to ExState
const convertToExState = (state: IState): ExState => ({
  ...state,
  project: state.project_id,
  workspace: state.workspace_id,
  parent: null,
  external_id: state.id,
  external_source: "plane",
  updated_by: "",
  created_by: "",
  created_at: new Date().toISOString(),
  update_at: new Date().toISOString(),
  status: "to_be_created" as const,
});

export function StateMappingFormContent({
  value,
  availableProjects,
  handleChange,
  isEditMode,
}: StateMappingFormContentProps) {
  const { getProjectById } = useProject();
  const { workspace, fetchStates } = useSentryIntegration();

  // Fetch states for the selected project using SWR
  const {
    data: projectStates,
    isLoading: statesLoading,
    error: statesError,
  } = useSWR(
    value.projectId && workspace?.slug ? `STATES_${workspace.slug}_${value.projectId}` : null,
    value.projectId && workspace?.slug
      ? async () => {
          const states = await fetchStates(workspace.slug, value.projectId);
          return states || [];
        }
      : null,
    {
      errorRetryCount: 1,
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );

  // Memoize project options to prevent re-computation on every render
  const projectOptions = useMemo(() => {
    const options = availableProjects.map((projectId) => {
      const project = getProjectById(projectId);
      return {
        value: projectId,
        query: project?.name || "",
        content: (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 flex-shrink-0">
              {project?.logo_props ? (
                <Logo logo={project.logo_props} size={16} />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary font-medium bg-accent-primary/10 rounded-sm text-caption-sm-regular">
                  {project?.name?.charAt(0).toUpperCase() || "P"}
                </div>
              )}
            </div>
            <span className="flex-grow truncate">{project?.name || "Project"}</span>
          </div>
        ),
      };
    });

    // If in edit mode, include the current project in options
    if (isEditMode && value.projectId) {
      const currentProject = getProjectById(value.projectId);
      if (currentProject && !availableProjects.includes(value.projectId)) {
        options.unshift({
          value: value.projectId,
          query: currentProject.name || "",
          content: (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 flex-shrink-0">
                {currentProject?.logo_props ? (
                  <Logo logo={currentProject.logo_props} size={16} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-primary font-medium bg-accent-primary/10 rounded-sm text-caption-sm-regular">
                    {currentProject?.name?.charAt(0).toUpperCase() || "P"}
                  </div>
                )}
              </div>
              <span className="flex-grow truncate">{currentProject?.name || "Project"}</span>
            </div>
          ),
        });
      }
    }

    return options;
  }, [availableProjects, isEditMode, value.projectId, getProjectById]);

  // Memoize resolved state options (exclude unresolved state)
  const resolvedStateOptions = useMemo(() => {
    if (!projectStates || statesError) return [];
    return projectStates
      .filter((state: IState) => state.id !== value.unresolvedState?.id)
      .map((state: IState) => ({
        value: state.id,
        query: state.name,
        content: (
          <div className="flex items-center gap-2">
            <StateGroupIcon stateGroup={state.group || "backlog"} />
            <span className="flex-grow truncate">{state.name}</span>
          </div>
        ),
      }));
  }, [projectStates, statesError, value.unresolvedState?.id]);

  // Memoize unresolved state options (exclude resolved state)
  const unresolvedStateOptions = useMemo(() => {
    if (!projectStates || statesError) return [];
    return projectStates
      .filter((state: IState) => state.id !== value.resolvedState?.id)
      .map((state: IState) => ({
        value: state.id,
        query: state.name,
        content: (
          <div className="flex items-center gap-2">
            <StateGroupIcon stateGroup={state.group || "backlog"} />
            <span className="flex-grow truncate">{state.name}</span>
          </div>
        ),
      }));
  }, [projectStates, statesError, value.resolvedState?.id]);

  // Memoize selected values to prevent re-computation
  const selectedProject = useMemo(
    () => (value.projectId ? getProjectById(value.projectId) : null),
    [value.projectId, getProjectById]
  );

  // Memoize change handlers to prevent re-renders
  const handleProjectChange = useCallback((projectId: string) => handleChange("projectId", projectId), [handleChange]);

  const handleResolvedStateChange = useCallback(
    (stateId: string) => {
      const state = projectStates?.find((s: IState) => s.id === stateId);
      const exState = state ? convertToExState(state) : null;
      handleChange("resolvedState", exState);
    },
    [handleChange, projectStates]
  );

  const handleUnresolvedStateChange = useCallback(
    (stateId: string) => {
      const state = projectStates?.find((s: IState) => s.id === stateId);
      const exState = state ? convertToExState(state) : null;
      handleChange("unresolvedState", exState);
    },
    [handleChange, projectStates]
  );

  return (
    <div className="border border-subtle rounded-lg p-4 space-y-4">
      {/* Project Selection */}
      <div className="space-y-2">
        <label className="text-body-xs-medium text-secondary">Project</label>
        <CustomSearchSelect
          value={value.projectId}
          onChange={handleProjectChange}
          options={projectOptions}
          label={
            selectedProject ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 flex-shrink-0">
                  {selectedProject?.logo_props ? (
                    <Logo logo={selectedProject.logo_props} size={16} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary font-medium bg-accent-primary/10 rounded-sm text-caption-sm-regular">
                      {selectedProject?.name?.charAt(0).toUpperCase() || "P"}
                    </div>
                  )}
                </div>
                <span className="flex-grow truncate">{selectedProject?.name || "Project"}</span>
              </div>
            ) : (
              <span className="text-placeholder">Select project</span>
            )
          }
          buttonClassName="h-9 w-full"
          optionsClassName="min-w-[200px]"
          disabled={isEditMode}
        />
      </div>

      {/* State Mappings */}
      {value.projectId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* States Loading State */}
          {statesLoading && (
            <div className="col-span-full flex items-center justify-center py-4">
              <div className="flex items-center gap-2 text-tertiary">
                <Loader>
                  <Loader.Item height="16px" width="100px" />
                </Loader>
                <span className="text-body-xs-regular">Loading project states...</span>
              </div>
            </div>
          )}

          {/* States Error State */}
          {statesError && !statesLoading && (
            <div className="col-span-full bg-danger-subtle border border-danger-subtle rounded-lg p-3">
              <div className="text-body-xs-medium text-danger-primary">Failed to load project states</div>
              <div className="text-caption-sm-regular text-danger-primary mt-1">
                Please try selecting the project again
              </div>
            </div>
          )}

          {/* State Dropdowns - only show if not loading and no error */}
          {!statesLoading && !statesError && (
            <>
              {/* Resolved State */}
              <div className="space-y-2">
                <label className="text-body-xs-medium text-secondary">
                  Resolved State
                  <span className="text-caption-sm-regular text-tertiary block">
                    State to set when Sentry issue is resolved
                  </span>
                </label>
                <CustomSearchSelect
                  value={value.resolvedState?.id || ""}
                  onChange={handleResolvedStateChange}
                  options={resolvedStateOptions}
                  label={
                    value.resolvedState ? (
                      <div className="flex items-center gap-2">
                        <StateGroupIcon stateGroup={value.resolvedState.group || "backlog"} />
                        <span className="flex-grow truncate">{value.resolvedState.name}</span>
                      </div>
                    ) : (
                      <span className="text-placeholder">
                        {resolvedStateOptions.length === 0 ? "No states available" : "Select resolved state"}
                      </span>
                    )
                  }
                  buttonClassName="h-9 w-full"
                  optionsClassName="min-w-[180px]"
                  disabled={resolvedStateOptions.length === 0}
                />
              </div>

              {/* Unresolved State */}
              <div className="space-y-2">
                <label className="text-body-xs-medium text-secondary">
                  Unresolved State
                  <span className="text-caption-sm-regular text-tertiary block">
                    State to set when Sentry issue is unresolved
                  </span>
                </label>
                <CustomSearchSelect
                  value={value.unresolvedState?.id || ""}
                  onChange={handleUnresolvedStateChange}
                  options={unresolvedStateOptions}
                  label={
                    value.unresolvedState ? (
                      <div className="flex items-center gap-2">
                        <StateGroupIcon stateGroup={value.unresolvedState.group || "backlog"} />
                        <span className="flex-grow truncate">{value.unresolvedState.name}</span>
                      </div>
                    ) : (
                      <span className="text-placeholder">
                        {unresolvedStateOptions.length === 0 ? "No states available" : "Select unresolved state"}
                      </span>
                    )
                  }
                  buttonClassName="h-9 w-full"
                  optionsClassName="min-w-[180px]"
                  disabled={unresolvedStateOptions.length === 0}
                />
              </div>
            </>
          )}
        </div>
      )}

      {/* Helper text */}
      {!value.projectId && (
        <div className="text-center py-4">
          <p className="text-body-xs-regular text-tertiary">Select a project to configure state mappings</p>
        </div>
      )}
    </div>
  );
}
