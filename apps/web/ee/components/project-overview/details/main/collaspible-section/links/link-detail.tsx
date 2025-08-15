"use client";

import { FC } from "react";
// hooks
// ui
import { observer } from "mobx-react";
import { Copy, LinkIcon, Pencil, Trash2 } from "lucide-react";
import { TOAST_TYPE, Tooltip, setToast } from "@plane/ui";
// icons
// types
// helpers
import { calculateTimeAgo, copyTextToClipboard } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useProjectLinks } from "@/plane-web/hooks/store";
import { TLinkOperationsModal } from "./create-update-link-modal";

export type TProjectLinkDetail = {
  linkId: string;
  linkOperations: TLinkOperationsModal;
  isNotAllowed: boolean;
};

export const ProjectLinkDetail: FC<TProjectLinkDetail> = observer((props) => {
  // props
  const { linkId, linkOperations, isNotAllowed } = props;
  // hooks
  const { getLinkById, toggleLinkModal, setLinkData } = useProjectLinks();
  const { getUserDetails } = useMember();
  const { isMobile } = usePlatformOS();

  const linkDetail = getLinkById(linkId);
  if (!linkDetail) return <></>;

  const toggleProjectLinkModal = (modalToggle: boolean) => {
    toggleLinkModal(modalToggle);
    setLinkData(linkDetail);
  };

  const createdByDetails = getUserDetails(linkDetail.created_by_id);

  return (
    <div key={linkId}>
      <div className="relative flex flex-col rounded-md bg-custom-background-90 p-2.5">
        <div
          className="flex w-full cursor-pointer items-start justify-between gap-2"
          onClick={() => {
            window.open(linkDetail.url, "_blank");
          }}
        >
          <div className="flex items-start gap-2 truncate">
            <span className="py-1">
              <LinkIcon className="h-3 w-3 flex-shrink-0" />
            </span>
            <Tooltip
              tooltipContent={linkDetail.title && linkDetail.title !== "" ? linkDetail.title : linkDetail.url}
              isMobile={isMobile}
            >
              <span className="truncate text-xs">
                {linkDetail.title && linkDetail.title !== "" ? linkDetail.title : linkDetail.url}
              </span>
            </Tooltip>
          </div>

          {!isNotAllowed && (
            <div className="z-[1] flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                className="flex items-center justify-center p-1 hover:bg-custom-background-80"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleProjectLinkModal(true);
                }}
              >
                <Pencil className="h-3 w-3 stroke-[1.5] text-custom-text-200" />
              </button>
              <span
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  copyTextToClipboard(linkDetail.url);
                  setToast({
                    type: TOAST_TYPE.SUCCESS,
                    title: "Link copied!",
                    message: "Link copied to clipboard",
                  });
                }}
                className="flex items-center justify-center p-1 hover:bg-custom-background-80"
              >
                <Copy className="h-3 w-3 stroke-[1.5] text-custom-text-200" />
              </span>
              <button
                type="button"
                className="flex items-center justify-center p-1 hover:bg-custom-background-80"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  linkOperations.remove(linkDetail.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="px-5">
          <p className="mt-0.5 stroke-[1.5] text-xs text-custom-text-300">
            Added {calculateTimeAgo(linkDetail.created_at)}
            <br />
            {createdByDetails && (
              <>
                by {createdByDetails?.is_bot ? createdByDetails?.first_name + " Bot" : createdByDetails?.display_name}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
});
