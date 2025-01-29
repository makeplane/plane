"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { LinkIcon, Users } from "lucide-react";
// plane types
import { IModule, TPowerKPageKeys } from "@plane/types";
// hooks
import { DoubleCircleIcon, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useModule } from "@/hooks/store";
// local components
import { PowerKCommandItem } from "../../command-item";
import { PowerKMembersMenu } from "../members-menu";
import { PowerKModuleStatusMenu } from "./status-menu";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
  moduleId: string;
};

export const PowerKModuleActionsMenu: React.FC<Props> = observer((props) => {
  const { activePage, handleClose, handleUpdateSearchTerm, handleUpdatePage, moduleId } = props;
  // navigation
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { getModuleById, updateModuleDetails } = useModule();
  // derived values
  const moduleDetails = getModuleById(moduleId);

  const handleUpdateModule = async (formData: Partial<IModule>) => {
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
  };

  const handleUpdateMember = (memberId: string) => {
    if (!moduleDetails) return;

    const updatedMembers = moduleDetails.member_ids ?? [];
    if (updatedMembers.includes(memberId)) updatedMembers.splice(updatedMembers.indexOf(memberId), 1);
    else updatedMembers.push(memberId);

    handleUpdateModule({ member_ids: updatedMembers });
  };

  const copyModuleUrlToClipboard = () => {
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
  };

  return (
    <>
      {!activePage && (
        <Command.Group heading="Module actions">
          <PowerKCommandItem
            icon={Users}
            label="Add/remove members"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-module-member");
            }}
          />
          <PowerKCommandItem
            icon={DoubleCircleIcon}
            label="Change status"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-module-status");
            }}
          />
          <PowerKCommandItem
            icon={LinkIcon}
            label="Copy module URL"
            onSelect={() => {
              handleClose();
              copyModuleUrlToClipboard();
            }}
          />
        </Command.Group>
      )}
      {/* members menu */}
      {activePage === "change-module-member" && moduleDetails && (
        <PowerKMembersMenu handleUpdateMember={handleUpdateMember} value={moduleDetails.member_ids} />
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
