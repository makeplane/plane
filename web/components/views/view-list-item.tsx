import React, { useRef } from "react";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useRouter } from "next/router";
// types
import { IProjectView } from "@plane/types";
// components
import { FavoriteStar } from "@/components/core";
import { ViewQuickActions } from "@/components/views";
// constants
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useProjectView, useUser } from "@/hooks/store";

type Props = {
  view: IProjectView;
};

export const ProjectViewListItem: React.FC<Props> = observer((props) => {
  const { view } = props;
  // refs
  const parentRef = useRef(null);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { addViewToFavorites, removeViewFromFavorites } = useProjectView();

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    addViewToFavorites(workspaceSlug.toString(), projectId.toString(), view.id);
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    removeViewFromFavorites(workspaceSlug.toString(), projectId.toString(), view.id);
  };

  // @ts-expect-error key types are not compatible
  const totalFilters = calculateTotalFilters(view.filters ?? {});

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <div ref={parentRef} className="group border-b border-custom-border-200 hover:bg-custom-background-90">
      <Link href={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}>
        <div className="relative flex h-[52px] w-full items-center justify-between rounded p-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="flex flex-col overflow-hidden ">
                <p className="truncate break-all text-sm font-medium  leading-4">{view.name}</p>
                {view?.description && <p className="break-all text-xs text-custom-text-200">{view.description}</p>}
              </div>
            </div>
            <div className="ml-2 flex flex-shrink-0">
              <div className="flex items-center gap-4">
                <p className="hidden rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-200 group-hover:block">
                  {totalFilters} {totalFilters === 1 ? "filter" : "filters"}
                </p>
                {isEditingAllowed && (
                  <FavoriteStar
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (view.is_favorite) handleRemoveFromFavorites();
                      else handleAddToFavorites();
                    }}
                    selected={view.is_favorite}
                  />
                )}
                {projectId && workspaceSlug && (
                  <ViewQuickActions
                    parentRef={parentRef}
                    projectId={projectId.toString()}
                    view={view}
                    workspaceSlug={workspaceSlug.toString()}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
});
