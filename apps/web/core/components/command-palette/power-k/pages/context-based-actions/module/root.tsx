"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { LinkIcon, Users } from "lucide-react";
// plane imports
import { DoubleCircleIcon } from "@plane/propel/icons";
import type { IModule } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useModule } from "@/hooks/store/use-module";
// local imports
import type { TPowerKPageKeys } from "../../../types";
import { PowerKModalCommandItem } from "../../../modal/command-item";
import { PowerKMembersMenu } from "../members-menu";
import { PowerKModuleStatusMenu } from "./status-menu";
import { useCallback } from "react";

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

  const handleUpdateModule = useCallback(
    async (formData: Partial<IModule>) => {
      if (!workspaceSlug || !projectId || !moduleDetails) return;
      await updateModuleDetails(workspaceSlug.toString(), projectId.toString(), moduleDetails.id, formData).catch(
        (error) => {
          console.error("Error in updating issue from Power K:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Issue could not be updated. Please try again.",
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

  const copyModuleUrlToClipboard = useCallback(() => {
    const url = new URL(window.location.href);
    copyTextToClipboard(url.href)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Copied to clipboard",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Some error occurred",
        });
      });
  }, []);

  if (!moduleDetails) return null;

  return (
    <>
      {!activePage && (
        <Command.Group heading="Module actions">
          <PowerKModalCommandItem
            icon={Users}
            label="Add/remove members"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-module-member");
            }}
          />
          <PowerKModalCommandItem
            icon={DoubleCircleIcon}
            label="Change status"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-module-status");
            }}
          />
          <PowerKModalCommandItem
            icon={LinkIcon}
            label="Copy URL"
            onSelect={() => {
              handleClose();
              copyModuleUrlToClipboard();
            }}
          />
        </Command.Group>
      )}
      {/* members menu */}
      {activePage === "change-module-member" && moduleDetails && (
        <PowerKMembersMenu
          handleUpdateMember={handleUpdateMember}
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
