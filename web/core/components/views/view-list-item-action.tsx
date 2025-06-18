import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Earth, Lock } from "lucide-react";
// types
import { EUserPermissions, EUserPermissionsLevel, IS_FAVORITE_MENU_OPEN } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { EViewAccess, IProjectView } from "@plane/types";
// ui
import { Tooltip, FavoriteStar } from "@plane/ui";
import { calculateTotalFilters, getPublishViewLink } from "@plane/utils";
// components
import { DeleteProjectViewModal, CreateUpdateProjectViewModal, ViewQuickActions } from "@/components/views";
// helpers
// hooks
import { useMember, useProjectView, useUserPermissions } from "@/hooks/store";
import { PublishViewModal } from "@/plane-web/components/views/publish";
import { ButtonAvatars } from "../dropdowns/member/avatar";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  view: IProjectView;
};

export const ViewListItemAction: FC<Props> = observer((props) => {
  const { parentRef, view } = props;
  // states
  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  const [isPublishModalOpen, setPublishModalOpen] = useState<boolean>(false);
  // router
  const { workspaceSlug, projectId } = useParams();
  // store
  const { allowPermissions } = useUserPermissions();

  const { addViewToFavorites, removeViewFromFavorites } = useProjectView();
  const { getUserDetails } = useMember();

  // local storage
  const { setValue: toggleFavoriteMenu, storedValue: isFavoriteOpen } = useLocalStorage<boolean>(
    IS_FAVORITE_MENU_OPEN,
    false
  );

  // derived values
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  const totalFilters = calculateTotalFilters(view.filters ?? {});

  const access = view.access;

  const publishLink = getPublishViewLink(view?.anchor);

  // handlers
  const handleAddToFavorites = async () => {
    if (!workspaceSlug || !projectId) return;

    await addViewToFavorites(workspaceSlug.toString(), projectId.toString(), view.id);
    if (!isFavoriteOpen) toggleFavoriteMenu(true);
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    removeViewFromFavorites(workspaceSlug.toString(), projectId.toString(), view.id);
  };

  const ownedByDetails = view.owned_by ? getUserDetails(view.owned_by) : undefined;

  return (
    <>
      <PublishViewModal isOpen={isPublishModalOpen} onClose={() => setPublishModalOpen(false)} view={view} />
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
      <p className="hidden rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-200 group-hover:block">
        {totalFilters} {totalFilters === 1 ? "filter" : "filters"}
      </p>

      <div className="cursor-default text-custom-text-300">
        <Tooltip tooltipContent={access === EViewAccess.PUBLIC ? "Public" : "Private"}>
          {access === EViewAccess.PUBLIC ? <Earth className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </Tooltip>
      </div>

      {view?.anchor && publishLink ? (
        <div
          className="px-3 py-1.5 bg-green-500/20 text-green-500 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          onClick={() => setPublishModalOpen(true)}
        >
          <span className="flex-shrink-0 rounded-full size-1.5 bg-green-500" />
          Live
        </div>
      ) : (
        <></>
      )}

      {/* created by */}
      {<ButtonAvatars showTooltip={false} userIds={ownedByDetails?.id ?? []} />}

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
        <div className="hidden md:block">
          <ViewQuickActions
            parentRef={parentRef}
            projectId={projectId.toString()}
            view={view}
            workspaceSlug={workspaceSlug.toString()}
          />
        </div>
      )}
    </>
  );
});
