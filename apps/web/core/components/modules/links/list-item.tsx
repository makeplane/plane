import { observer } from "mobx-react";

import { MODULE_TRACKER_ELEMENTS } from "@plane/constants";
import { CopyIcon, EditIcon, TrashIcon } from "@plane/propel/icons";
// plane types
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { ILinkDetails } from "@plane/types";
// plane ui
import { getIconForLink, copyTextToClipboard, calculateTimeAgo } from "@plane/utils";
// helpers
//
// hooks
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  handleDeleteLink: () => void;
  handleEditLink: () => void;
  isEditingAllowed: boolean;
  link: ILinkDetails;
};

export const ModulesLinksListItem = observer(function ModulesLinksListItem(props: Props) {
  const { handleDeleteLink, handleEditLink, isEditingAllowed, link } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const createdByDetails = getUserDetails(link.created_by);
  // platform os
  const { isMobile } = usePlatformOS();

  const Icon = getIconForLink(link.url);

  const copyToClipboard = (text: string) => {
    copyTextToClipboard(text).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Copied to clipboard",
        message: "The URL has been successfully copied to your clipboard",
      })
    );
  };

  return (
    <div className="relative flex flex-col rounded-md bg-layer-3 p-2.5">
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex items-start gap-2 truncate">
          <span className="py-1">
            <Icon className="size-3 stroke-2 text-tertiary group-hover:text-primary shrink-0" />
          </span>
          <Tooltip tooltipContent={link.title && link.title !== "" ? link.title : link.url} isMobile={isMobile}>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer truncate text-11">
              {link.title && link.title !== "" ? link.title : link.url}
            </a>
          </Tooltip>
        </div>

        <div className="z-1 flex shrink-0 items-center">
          {isEditingAllowed && (
            <button
              type="button"
              className="grid place-items-center p-1 hover:bg-layer-transparent-hover text-secondary rounded-sm"
              data-ph-element={MODULE_TRACKER_ELEMENTS.LIST_ITEM}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEditLink();
              }}
            >
              <EditIcon className="size-3 stroke-[1.5]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => copyToClipboard(link.url)}
            className="grid place-items-center p-1 hover:bg-layer-transparent-hover text-secondary rounded-sm"
          >
            <CopyIcon className="size-3 stroke-[1.5]" />
          </button>
          {isEditingAllowed && (
            <button
              type="button"
              className="grid place-items-center p-1 hover:bg-layer-transparent-hover text-secondary rounded-sm"
              data-ph-element={MODULE_TRACKER_ELEMENTS.LIST_ITEM}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteLink();
              }}
            >
              <TrashIcon className="size-3 stroke-[1.5]" />
            </button>
          )}
        </div>
      </div>
      <div className="px-5">
        <p className="flex items-center gap-1.5 mt-0.5 stroke-[1.5] text-11 text-tertiary">
          Added {calculateTimeAgo(link.created_at)}{" "}
          {createdByDetails && (
            <>by {createdByDetails?.is_bot ? createdByDetails?.first_name + " Bot" : createdByDetails?.display_name}</>
          )}
        </p>
      </div>
    </div>
  );
});
