import React, { FC, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
// types
import { IProjectView } from "@plane/types";
// components
import { FavoriteStar } from "@/components/core";
import { DeleteProjectViewModal, CreateUpdateProjectViewModal, ViewQuickActions } from "@/components/views";
// constants
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { calculateTotalFilters } from "@/helpers/filter.helper";
// hooks
import { useMember, useProjectView, useUser } from "@/hooks/store";
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
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { addViewToFavorites, removeViewFromFavorites } = useProjectView();
  const { getUserDetails } = useMember();

  // derived values
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const totalFilters = calculateTotalFilters(view.filters ?? {});

  // handlers
  const handleAddToFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    addViewToFavorites(workspaceSlug.toString(), projectId.toString(), view.id);
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !projectId) return;

    removeViewFromFavorites(workspaceSlug.toString(), projectId.toString(), view.id);
  };

  const createdByDetails = view.created_by ? getUserDetails(view.created_by) : undefined;

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
      <p className="hidden rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-200 group-hover:block">
        {totalFilters} {totalFilters === 1 ? "filter" : "filters"}
      </p>

      {/* created by */}
      {createdByDetails && <ButtonAvatars showTooltip={false} userIds={createdByDetails?.id} />}

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
    </>
  );
});
