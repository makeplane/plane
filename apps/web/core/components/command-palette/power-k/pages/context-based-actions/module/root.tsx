"use client";

import { useCallback } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { IModule } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
// local imports
import { PowerKMembersMenu } from "../../../menus/members";
import { PowerKModalCommandItem } from "../../../modal/command-item";
import type { TPowerKPageKeys } from "../../../types";
import { getPowerKModuleContextBasedActions } from "./actions";
import { PowerKModuleStatusMenu } from "./status-menu";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
};

export const PowerKModuleActionsMenu: React.FC<Props> = observer((props) => {
  const { activePage, handleClose, handleUpdateSearchTerm, handleUpdatePage } = props;
  // navigation
  const { workspaceSlug, projectId, moduleId } = useParams();
  // store hooks
  const { getModuleById, updateModuleDetails } = useModule();
  const {
    project: { getProjectMemberIds },
  } = useMember();
  // derived values
  const moduleDetails = moduleId ? getModuleById(moduleId.toString()) : null;
  const projectMemberIds = moduleDetails?.project_id ? getProjectMemberIds(moduleDetails.project_id, false) : [];
  // translation
  const { t } = useTranslation();

  const handleUpdateModule = useCallback(
    async (formData: Partial<IModule>) => {
      if (!workspaceSlug || !projectId || !moduleDetails) return;
      await updateModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleDetails.id, formData).catch(
        () => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Module could not be updated. Please try again.",
          });
        }
      );
    },
    [moduleDetails, projectId, updateModuleDetails, workspaceSlug]
  );

  const handleUpdateMember = useCallback(
    (memberId: string) => {
      if (!moduleDetails) return;

      const updatedMembers = moduleDetails.member_ids ?? [];
      if (updatedMembers.includes(memberId)) updatedMembers.splice(updatedMembers.indexOf(memberId), 1);
      else updatedMembers.push(memberId);

      handleUpdateModule({ member_ids: updatedMembers });
    },
    [handleUpdateModule, moduleDetails]
  );

  const ACTIONS_LIST = getPowerKModuleContextBasedActions({
    handleClose,
    handleUpdatePage,
    handleUpdateSearchTerm,
    moduleDetails,
  });

  if (!moduleDetails) return null;

  return (
    <>
      {!activePage && (
        <Command.Group heading={t("power_k.contextual_actions.module.title")}>
          {ACTIONS_LIST.map((action) => {
            if (action.shouldRender === false) return null;

            return (
              <PowerKModalCommandItem
                key={action.key}
                icon={action.icon}
                label={t(action.i18n_label)}
                onSelect={action.action}
              />
            );
          })}
        </Command.Group>
      )}
      {/* members menu */}
      {activePage === "change-module-member" && moduleDetails && (
        <PowerKMembersMenu
          handleSelect={handleUpdateMember}
          userIds={projectMemberIds ?? undefined}
          value={moduleDetails.member_ids}
        />
      )}
      {/* status menu */}
      {activePage === "change-module-status" && moduleDetails?.status && (
        <PowerKModuleStatusMenu
          handleClose={handleClose}
          handleUpdateModule={handleUpdateModule}
          value={moduleDetails.status}
        />
      )}
    </>
  );
});
