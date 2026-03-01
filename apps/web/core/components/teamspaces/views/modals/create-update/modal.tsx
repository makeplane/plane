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

import { observer } from "mobx-react";
// plane imports
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectView, TTeamspaceView } from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { joinUrlPath } from "@plane/utils";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
// plan web imports
import { useAppRouter } from "@/hooks/use-app-router";
import { useTeamspaceViews } from "@/plane-web/hooks/store";
// local imports
import { TeamspaceViewForm } from "./form";

type Props = {
  data?: TTeamspaceView | null;
  isOpen: boolean;
  onClose: () => void;
  preLoadedData?: Partial<TTeamspaceView> | null;
  workspaceSlug: string;
  teamspaceId: string;
};

export const CreateUpdateTeamspaceViewModal = observer(function CreateUpdateTeamspaceViewModal(props: Props) {
  const { data, isOpen, onClose, preLoadedData, workspaceSlug, teamspaceId } = props;
  // router
  const router = useAppRouter();
  // store hooks
  const { createView, updateView } = useTeamspaceViews();
  const {
    issuesFilter: { mutateFilters },
  } = useIssues(EIssuesStoreType.TEAM_VIEW);
  const { resetExpression } = useWorkItemFilters();

  const handleClose = () => {
    onClose();
  };

  const handleCreateView = async (payload: TTeamspaceView) => {
    await createView(workspaceSlug, teamspaceId, payload)
      .then((view) => {
        router.push(joinUrlPath(workspaceSlug, "teamspaces", teamspaceId, "views", view.id));
        handleClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: "View created successfully.",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Something went wrong. Please try again.",
        });
      });
  };

  const handleUpdateView = async (payload: TTeamspaceView) => {
    await updateView(workspaceSlug, teamspaceId, data?.id as string, payload)
      .then((viewDetails) => {
        mutateFilters(workspaceSlug, viewDetails.id, viewDetails);
        resetExpression(EIssuesStoreType.TEAM_VIEW, viewDetails.id, viewDetails.rich_filters);
        handleClose();
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.detail ?? "Something went wrong. Please try again.",
        });
      });
  };

  const handleFormSubmit = async (formData: IProjectView | TTeamspaceView) => {
    if (!data) await handleCreateView(formData as TTeamspaceView);
    else await handleUpdateView(formData as TTeamspaceView);
  };

  if (!isOpen) return null;
  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <TeamspaceViewForm
        data={data}
        handleClose={handleClose}
        handleFormSubmit={handleFormSubmit}
        preLoadedData={preLoadedData}
        teamspaceId={teamspaceId}
        workspaceSlug={workspaceSlug}
      />
    </ModalCore>
  );
});
