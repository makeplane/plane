import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { PencilIcon, StarIcon, TrashIcon } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CreateUpdateProjectViewModal, DeleteProjectViewModal } from "components/views";
// ui
import { CustomMenu, PhotoFilterIcon } from "@plane/ui";
// helpers
import { truncateText } from "helpers/string.helper";
import { calculateTotalFilters } from "helpers/filter.helper";
// types
import { IProjectView } from "types";

type Props = {
  view: IProjectView;
};

export const ProjectViewListItem: React.FC<Props> = observer((props) => {
  const { view } = props;

  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { projectViews: projectViewsStore } = useMobxStore();

  const handleAddToFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    projectViewsStore.addViewToFavorites(workspaceSlug.toString(), projectId.toString(), view.id);
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    projectViewsStore.removeViewFromFavorites(workspaceSlug.toString(), projectId.toString(), view.id);
  };

  const totalFilters = calculateTotalFilters(view.query_data ?? {});

  return (
    <>
      {workspaceSlug && projectId && view && (
        <CreateUpdateProjectViewModal
          isOpen={createUpdateViewModal}
          onClose={() => setCreateUpdateViewModal(false)}
          workspaceSlug={workspaceSlug.toString()}
          projectId={projectId.toString()}
          data={view}
        />
      )}
      <DeleteProjectViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />
      <div className="group hover:bg-custom-background-90 border-b border-custom-border-200">
        <Link href={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}>
          <a className="flex items-center justify-between relative rounded p-4 w-full">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="grid place-items-center flex-shrink-0 h-10 w-10 rounded bg-custom-background-90 group-hover:bg-custom-background-100">
                  <PhotoFilterIcon className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col overflow-hidden ">
                  <p className="text-sm leading-4 font-medium truncate  break-all">{view.name}</p>
                  {view?.description && <p className="text-xs text-custom-text-200 break-all">{view.description}</p>}
                </div>
              </div>
              <div className="ml-2 flex flex-shrink-0">
                <div className="flex items-center gap-4">
                  <p className="rounded bg-custom-background-80 py-1 px-2 text-xs text-custom-text-200 hidden group-hover:block">
                    {totalFilters} {totalFilters === 1 ? "filter" : "filters"}
                  </p>

                  {view.is_favorite ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFromFavorites();
                      }}
                      className="grid place-items-center"
                    >
                      <StarIcon className="text-orange-400" fill="#f6ad55" size={14} strokeWidth={2} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToFavorites();
                      }}
                      className="grid place-items-center"
                    >
                      <StarIcon size={14} strokeWidth={2} />
                    </button>
                  )}
                  <CustomMenu width="auto" ellipsis>
                    <CustomMenu.MenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCreateUpdateViewModal(true);
                      }}
                    >
                      <span className="flex items-center justify-start gap-2">
                        <PencilIcon size={14} strokeWidth={2} />
                        <span>Edit View</span>
                      </span>
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteViewModal(true);
                      }}
                    >
                      <span className="flex items-center justify-start gap-2">
                        <TrashIcon size={14} strokeWidth={2} />
                        <span>Delete View</span>
                      </span>
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              </div>
            </div>
          </a>
        </Link>
      </div>
    </>
  );
});
