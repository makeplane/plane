import { LinkIcon } from "lucide-react";
// plane imports
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// local imports
import type { ContextBasedAction, TPowerKPageKeys } from "../../../types";

type TArgs = {
  handleClose: () => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
};

export const getPowerKCycleContextBasedActions = (args: TArgs): ContextBasedAction[] => {
  const { handleClose } = args;

  const copyCycleUrlToClipboard = () => {
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
      key: "copy-url",
      i18n_label: "power_k.contextual_actions.cycle.copy_url",
      icon: LinkIcon,
      action: () => {
        handleClose();
        copyCycleUrlToClipboard();
      },
    },
  ];
};
