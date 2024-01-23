import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { LinkIcon, PencilIcon, StarIcon, TrashIcon } from "lucide-react";
// hooks
import { useProjectView, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { CreateUpdateProjectViewModal, DeleteProjectViewModal } from "components/views";
// ui
import { CustomMenu, PhotoFilterIcon } from "@plane/ui";
// helpers
import { calculateTotalFilters } from "helpers/filter.helper";
import { copyUrlToClipboard } from "helpers/string.helper";
// types
import { IProjectView } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";

type Props = {
  view: IProjectView;
};

export const ProjectViewListItem: React.FC<Props> = observer((props) => {
  const { view } = props;
  // states
  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // toast alert
  const { setToastAlert } = useToast();
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

  const handleCopyText = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/views/${view.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "View link copied to clipboard.",
      });
    });
  };

  const totalFilters = calculateTotalFilters(view.filters ?? {});

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

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
      <div className="group border-b border-custom-border-200 hover:bg-custom-background-90">
        <Link href={`/${workspaceSlug}/projects/${projectId}/views/${view.id}`}>
          <div className="relative flex w-full items-center justify-between rounded p-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded bg-custom-background-90 group-hover:bg-custom-background-100">
                  <PhotoFilterIcon className="h-3.5 w-3.5" />
                </div>
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
                  {isEditingAllowed &&
                    (view.is_favorite ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveFromFavorites();
                        }}
                        className="grid place-items-center"
                      >
                        <StarIcon className="h-3.5 w-3.5 fill-orange-400 text-orange-400" strokeWidth={2} />
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
                    ))}

                  <CustomMenu ellipsis>
                    {isEditingAllowed && (
                      <>
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
                      </>
                    )}
                    <CustomMenu.MenuItem onClick={handleCopyText}>
                      <span className="flex items-center justify-start gap-2">
                        <LinkIcon className="h-3 w-3" />
                        <span>Copy view link</span>
                      </span>
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
});
