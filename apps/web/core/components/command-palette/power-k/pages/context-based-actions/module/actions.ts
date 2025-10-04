import { LinkIcon, Users } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { DoubleCircleIcon } from "@plane/propel/icons";
import { EUserPermissions, type IModule } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// lib
import { store } from "@/lib/store-context";
// local imports
import type { ContextBasedAction, TPowerKPageKeys } from "../../../types";

type TArgs = {
  handleClose: () => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  moduleDetails: IModule | undefined | null;
};

export const getPowerKModuleContextBasedActions = (args: TArgs): ContextBasedAction[] => {
  const { handleClose, handleUpdatePage, handleUpdateSearchTerm, moduleDetails } = args;
  // store
  const { allowPermissions } = store.user.permission;
  // permission
  const isEditingAllowed =
    allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.PROJECT) &&
    !moduleDetails?.archived_at;

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

  return [
    {
      key: "change-member",
      i18n_label: "power_k.contextual_actions.module.add_remove_members",
      icon: Users,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-module-member");
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "change-status",
      i18n_label: "power_k.contextual_actions.module.change_status",
      icon: DoubleCircleIcon,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-module-status");
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "copy-url",
      i18n_label: "power_k.contextual_actions.module.copy_url",
      icon: LinkIcon,
      action: () => {
        handleClose();
        copyModuleUrlToClipboard();
      },
    },
  ];
};
