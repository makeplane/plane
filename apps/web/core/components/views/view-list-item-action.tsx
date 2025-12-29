import type { FC } from "react";
import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Earth } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, IS_FAVORITE_MENU_OPEN } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { LockIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { IProjectView } from "@plane/types";
import { EViewAccess } from "@plane/types";
import { FavoriteStar } from "@plane/ui";
import { getPublishViewLink } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { PublishViewModal } from "@/plane-web/components/views/publish";
// local imports
import { ButtonAvatars } from "../dropdowns/member/avatar";
import { DeleteProjectViewModal } from "./delete-view-modal";
import { CreateUpdateProjectViewModal } from "./modal";
import { ViewQuickActions } from "./quick-actions";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  view: IProjectView;
};

export const ViewListItemAction = observer(function ViewListItemAction(props: Props) {
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
      <div className="cursor-default text-tertiary">
        <Tooltip tooltipContent={access === EViewAccess.PUBLIC ? "Public" : "Private"}>
          {access === EViewAccess.PUBLIC ? <Earth className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
        </Tooltip>
      </div>

      {view?.anchor && publishLink ? (
        <div
          className="px-3 py-1.5 bg-success-subtle text-success-primary rounded-sm text-11 font-medium flex items-center gap-1.5 cursor-pointer"
          onClick={() => setPublishModalOpen(true)}
        >
          <span className="flex-shrink-0 rounded-full size-1.5 bg-success-primary" />
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
