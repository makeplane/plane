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

import React, { memo } from "react";
import { ArrowRight } from "lucide-react";
import { EditIcon, TrashIcon, StateGroupIcon } from "@plane/propel/icons";
import type { TSentryStateMapping } from "@plane/etl/sentry";
import { Logo } from "@plane/propel/emoji-icon-picker";
// hooks
import { useProject } from "@/hooks/store/use-project";

interface StateMappingItemProps {
  mapping: TSentryStateMapping;
  onEdit: () => void;
  onDelete: () => void;
}

function StateMappingItemComponent({ mapping, onEdit, onDelete }: StateMappingItemProps) {
  const { getProjectById } = useProject();

  const project = getProjectById(mapping.projectId);
  const resolvedState = mapping.resolvedState;
  const unresolvedState = mapping.unresolvedState;

  if (!project) return null;

  return (
    <div className="group relative bg-surface-1 border border-subtle rounded-lg overflow-hidden hover:shadow-sm transition-all duration-200">
      {/* Status indicator strip */}
      <div className="absolute top-0 left-0 h-full w-1 bg-accent-primary/30 group-hover:bg-accent-primary transition-colors duration-300" />

      <div className="p-4 pl-5 relative flex items-center">
        {/* Main content container */}
        <div className="flex items-center flex-1 min-w-0 gap-4">
          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="bg-layer-1 py-2 px-3 rounded-lg border border-subtle shadow-sm transition-all duration-200 group-hover:border-subtle">
              <div className="flex items-center gap-2">
                {/* Project Logo */}
                <div className="h-4 w-4 flex-shrink-0 bg-surface-1 rounded-sm overflow-hidden flex items-center justify-center">
                  {project?.logo_props ? (
                    <Logo logo={project?.logo_props} size={12} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-primary font-medium bg-accent-primary/10 rounded-sm text-caption-xs-regular">
                      {project?.name?.charAt(0).toUpperCase() || "P"}
                    </div>
                  )}
                </div>

                {/* Project Name */}
                <span className="text-body-xs-medium text-primary truncate">{project?.name || "Project"}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-layer-2 to-surface-2 border border-subtle shadow-sm transition-all duration-200 group-hover:shadow group-hover:border-accent-strong/30">
              <ArrowRight className="h-4 w-4 text-tertiary group-hover:text-accent-primary transition-colors duration-300" />
            </div>
          </div>

          {/* State Mappings */}
          <div className="flex-1 min-w-0">
            <div className="bg-layer-1 py-2 px-3 rounded-lg border border-subtle shadow-sm transition-all duration-200 group-hover:border-subtle">
              <div className="space-y-2">
                {/* Resolved State */}
                <div className="flex items-center gap-2">
                  <span className="text-caption-sm-regular text-tertiary w-16 flex-shrink-0">Resolved:</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {resolvedState ? (
                      <>
                        <div className="w-3 h-3 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                          <StateGroupIcon stateGroup={resolvedState.group || "backlog"} />
                        </div>
                        <span className="text-caption-sm-medium text-primary truncate">{resolvedState.name}</span>
                      </>
                    ) : (
                      <span className="text-caption-sm-regular text-tertiary italic">State not found</span>
                    )}
                  </div>
                </div>

                {/* Unresolved State */}
                <div className="flex items-center gap-2">
                  <span className="text-caption-sm-regular text-tertiary w-16 flex-shrink-0">Unresolved:</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {unresolvedState ? (
                      <>
                        <div className="w-3 h-3 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                          <StateGroupIcon stateGroup={unresolvedState.group || "backlog"} />
                        </div>
                        <span className="text-caption-sm-medium text-primary truncate">{unresolvedState.name}</span>
                      </>
                    ) : (
                      <span className="text-caption-sm-regular text-tertiary italic">State not found</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - positioned absolutely */}
        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-surface-1 rounded-sm border border-subtle shadow-sm">
          <button
            className="flex-shrink-0 w-6 h-6 rounded-sm flex justify-center items-center overflow-hidden transition-colors hover:bg-layer-1 cursor-pointer text-secondary hover:text-primary"
            onClick={onEdit}
          >
            <EditIcon className="w-3 h-3" />
          </button>
          <button
            className="flex-shrink-0 w-6 h-6 rounded-sm flex justify-center items-center overflow-hidden transition-colors hover:bg-layer-1 cursor-pointer text-danger-primary hover:text-danger-primary"
            onClick={onDelete}
          >
            <TrashIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const StateMappingItem = memo(StateMappingItemComponent);
