"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Pencil, Trash2, LinkIcon, Copy, CircleDot, GitPullRequest } from "lucide-react";
import { EIssueServiceType } from "@plane/constants";
import { TIssueServiceType } from "@plane/types";
// ui
import { Tooltip, TOAST_TYPE, setToast, CustomMenu, GithubIcon } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
import { calculateTimeAgoShort } from "@/helpers/date-time.helper";
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { TLinkOperationsModal } from "./create-update-link-modal";

type TIssueLinkItem = {
  linkId: string;
  linkOperations: TLinkOperationsModal;
  isNotAllowed: boolean;
  issueServiceType?: TIssueServiceType;
};

type GithubLinkIconProps = {
  url: string;
};

const getGithubLinkType = (url: string) => {
  if (url.includes("issues")) return "issue";
  if (url.includes("pull")) return "pull";
  return null;
};

const GithubLinkTypeIcon = ({ type }: { type: string | null }) => {
  if (!type) return null;

  return (
    <div className="absolute bottom-0 left-1/2 w-3 h-3 rounded-full bg-custom-background-90 flex justify-center items-center">
      {type === "issue" ? (
        <CircleDot size={10} className="text-custom-text-200" />
      ) : (
        <GitPullRequest size={10} className="text-custom-text-200" />
      )}
    </div>
  );
};

export const GithubLinkIcon: FC<GithubLinkIconProps> = ({ url }) => {
  const linkType = getGithubLinkType(url);

  return (
    <div className="flex-shrink-0 relative w-7 h-7 rounded-full flex justify-center items-center z-[3]">
      <GithubIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
      <GithubLinkTypeIcon type={linkType} />
    </div>
  );
};

export const IssueLinkItem: FC<TIssueLinkItem> = observer((props) => {
  // props
  const { linkId, linkOperations, isNotAllowed, issueServiceType = EIssueServiceType.ISSUES } = props;
  // hooks
  const {
    toggleIssueLinkModal: toggleIssueLinkModalStore,
    setIssueLinkData,
    link: { getLinkById },
  } = useIssueDetail(issueServiceType);
  const { isMobile } = usePlatformOS();
  const linkDetail = getLinkById(linkId);
  if (!linkDetail) return <></>;

  const toggleIssueLinkModal = (modalToggle: boolean) => {
    toggleIssueLinkModalStore(modalToggle);
    setIssueLinkData(linkDetail);
  };
  return (
    <>
      <div
        key={linkId}
        className="group col-span-12 lg:col-span-6 xl:col-span-4 2xl:col-span-3 3xl:col-span-2 flex items-center justify-between gap-3 h-10 flex-shrink-0 px-3 bg-custom-background-90 hover:bg-custom-background-80 border-[0.5px] border-custom-border-200 rounded"
      >
        <div className="flex items-center gap-2.5 truncate flex-grow">
          {linkDetail.url.startsWith("https://github.com") ? (
            <GithubLinkIcon url={linkDetail.url} />
          ) : (
            <LinkIcon className="size-4 flex-shrink-0 text-custom-text-400 group-hover:text-custom-text-200" />
          )}
          <Tooltip tooltipContent={linkDetail.url} isMobile={isMobile}>
            <a
              href={linkDetail.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm cursor-pointer flex-grow"
            >
              {linkDetail.title && linkDetail.title !== "" ? linkDetail.title : linkDetail.url}
            </a>
          </Tooltip>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <p className="p-1 text-xs align-bottom leading-5 text-custom-text-400 group-hover-text-custom-text-200">
            {calculateTimeAgoShort(linkDetail.created_at)}
          </p>
          <span
            onClick={() => {
              copyTextToClipboard(linkDetail.url);
              setToast({
                type: TOAST_TYPE.SUCCESS,
                title: "Link copied!",
                message: "Link copied to clipboard",
              });
            }}
            className="relative grid place-items-center rounded p-1 text-custom-text-400 outline-none group-hover:text-custom-text-200 cursor-pointer hover:bg-custom-background-80"
          >
            <Copy className="h-3.5 w-3.5 stroke-[1.5]" />
          </span>
          <CustomMenu
            ellipsis
            buttonClassName="text-custom-text-400 group-hover:text-custom-text-200"
            placement="bottom-end"
            closeOnSelect
            disabled={isNotAllowed}
          >
            <CustomMenu.MenuItem
              className="flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleIssueLinkModal(true);
              }}
            >
              <Pencil className="h-3 w-3 stroke-[1.5] text-custom-text-200" />
              Edit
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem
              className="flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                linkOperations.remove(linkDetail.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
    </>
  );
});
