import React, { memo } from "react";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { TSentryStateMapping } from "@plane/etl/sentry";
import { Logo, StateGroupIcon } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";

interface StateMappingItemProps {
  mapping: TSentryStateMapping;
  onEdit: () => void;
  onDelete: () => void;
}

const StateMappingItemComponent: React.FC<StateMappingItemProps> = ({ mapping, onEdit, onDelete }) => {
  const { getProjectById } = useProject();

  const project = getProjectById(mapping.projectId);
  const resolvedState = mapping.resolvedState;
  const unresolvedState = mapping.unresolvedState;

  if (!project) return null;

  return (
    <div className="group relative bg-custom-background-100 border border-custom-border-200 rounded-lg overflow-hidden hover:shadow-sm transition-all duration-200">
      {/* Status indicator strip */}
      <div className="absolute top-0 left-0 h-full w-1 bg-custom-primary-100/30 group-hover:bg-custom-primary-100 transition-colors duration-300" />

      <div className="p-4 pl-5 relative flex items-center">
        {/* Main content container */}
        <div className="flex items-center flex-1 min-w-0 gap-4">
          {/* Project Info */}
          <div className="flex-1 min-w-0">
            <div className="bg-custom-background-90 py-2 px-3 rounded-lg border border-custom-border-200 shadow-sm transition-all duration-200 group-hover:border-custom-border-300">
              <div className="flex items-center gap-2">
                {/* Project Logo */}
                <div className="h-4 w-4 flex-shrink-0 bg-custom-background-100 rounded overflow-hidden flex items-center justify-center">
                  {project?.logo_props ? (
                    <Logo logo={project?.logo_props} size={12} />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-custom-text-100 font-medium bg-custom-primary-100/10 rounded text-[10px]">
                      {project?.name?.charAt(0).toUpperCase() || "P"}
                    </div>
                  )}
                </div>

                {/* Project Name */}
                <span className="text-sm text-custom-text-100 font-medium truncate">{project?.name || "Project"}</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-r from-custom-background-80 to-custom-background-90 border border-custom-border-200 shadow-sm transition-all duration-200 group-hover:shadow group-hover:border-custom-primary-100/30">
              <ArrowRight className="h-4 w-4 text-custom-text-300 group-hover:text-custom-primary-100 transition-colors duration-300" />
            </div>
          </div>

          {/* State Mappings */}
          <div className="flex-1 min-w-0">
            <div className="bg-custom-background-90 py-2 px-3 rounded-lg border border-custom-border-200 shadow-sm transition-all duration-200 group-hover:border-custom-border-300">
              <div className="space-y-2">
                {/* Resolved State */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-custom-text-300 w-16 flex-shrink-0">Resolved:</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {resolvedState ? (
                      <>
                        <div className="w-3 h-3 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                          <StateGroupIcon stateGroup={resolvedState.group || "backlog"} />
                        </div>
                        <span className="text-xs text-custom-text-100 font-medium truncate">{resolvedState.name}</span>
                      </>
                    ) : (
                      <span className="text-xs text-custom-text-300 italic">State not found</span>
                    )}
                  </div>
                </div>

                {/* Unresolved State */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-custom-text-300 w-16 flex-shrink-0">Unresolved:</span>
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    {unresolvedState ? (
                      <>
                        <div className="w-3 h-3 flex-shrink-0 overflow-hidden relative flex justify-center items-center">
                          <StateGroupIcon stateGroup={unresolvedState.group || "backlog"} />
                        </div>
                        <span className="text-xs text-custom-text-100 font-medium truncate">
                          {unresolvedState.name}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-custom-text-300 italic">State not found</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions - positioned absolutely */}
        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1 bg-custom-background-100 rounded border border-custom-border-200 shadow-sm">
          <button
            className="flex-shrink-0 w-6 h-6 rounded flex justify-center items-center overflow-hidden transition-colors hover:bg-custom-background-80 cursor-pointer text-custom-text-200 hover:text-custom-text-100"
            onClick={onEdit}
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            className="flex-shrink-0 w-6 h-6 rounded flex justify-center items-center overflow-hidden transition-colors hover:bg-custom-background-80 cursor-pointer text-red-500 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const StateMappingItem = memo(StateMappingItemComponent);
