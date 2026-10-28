/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { GlobeOutline, LockOutline } from "@makeplane/propel/icons";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, IS_FAVORITE_MENU_OPEN } from "@plane/constants";
import { useLocalStorage } from "@plane/hooks";
import { Badge } from "@makeplane/propel/components/badge";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { useTranslation } from "@plane/i18n";
import type { IProjectView } from "@plane/types";
import { EViewAccess } from "@plane/types";
import { FavoriteStar } from "@plane/blocks/common";
import { getPublishViewLink } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useUserPermissions } from "@/hooks/store/user";
// local imports
import { ButtonAvatars } from "../dropdowns/member/avatar";
import { DeleteProjectViewModal } from "./delete-view-modal";
import { CreateUpdateProjectViewModal } from "./modal";
import { ViewQuickActions } from "./quick-actions";

type Props = {
  parentRef: React.RefObject<HTMLElement | null>;
  view: IProjectView;
};

export const ViewListItemAction = observer(function ViewListItemAction(props: Props) {
  const { parentRef, view } = props;
  const { t } = useTranslation();
  // states
  const [createUpdateViewModal, setCreateUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  const [_, setPublishModalOpen] = useState<boolean>(false);
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
        <Tooltip label={access === EViewAccess.PUBLIC ? t("common.access.public") : t("common.access.private")}>
          {access === EViewAccess.PUBLIC ? <GlobeOutline className="h-4 w-4" /> : <LockOutline className="h-4 w-4" />}
        </Tooltip>
      </div>

      {view?.anchor && publishLink ? (
        <button type="button" className="flex-shrink-0 cursor-pointer" onClick={() => setPublishModalOpen(true)}>
          <Badge
            variant="success"
            size="sm"
            startIcon={<span className="size-1.5 flex-shrink-0 rounded-full bg-success-primary" />}
            label={t("common.live")}
          />
        </button>
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
