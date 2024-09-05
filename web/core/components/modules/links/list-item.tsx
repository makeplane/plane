import { observer } from "mobx-react";
import { ExternalLink, LinkIcon, Pencil, Trash2 } from "lucide-react";
// plane types
import { ILinkDetails } from "@plane/types";
// plane ui
import { setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
// helpers
import { calculateTimeAgo } from "@/helpers/date-time.helper";
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useMember } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  handleDeleteLink: () => void;
  handleEditLink: () => void;
  isEditingAllowed: boolean;
  link: ILinkDetails;
};

export const ModulesLinksListItem: React.FC<Props> = observer((props) => {
  const { handleDeleteLink, handleEditLink, isEditingAllowed, link } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const createdByDetails = getUserDetails(link.created_by);
  // platform os
  const { isMobile } = usePlatformOS();

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
    <div className="relative flex flex-col rounded-md bg-custom-background-90 p-2.5">
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex items-start gap-2 truncate">
          <span className="py-1">
            <LinkIcon className="h-3 w-3 flex-shrink-0" />
          </span>
          <Tooltip tooltipContent={link.title && link.title !== "" ? link.title : link.url} isMobile={isMobile}>
            <span
              className="cursor-pointer truncate text-xs"
              onClick={() => copyToClipboard(link.title && link.title !== "" ? link.title : link.url)}
            >
              {link.title && link.title !== "" ? link.title : link.url}
            </span>
          </Tooltip>
        </div>

        <div className="z-[1] flex flex-shrink-0 items-center">
          {isEditingAllowed && (
            <button
              type="button"
              className="grid place-items-center p-1 hover:bg-custom-background-80"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEditLink();
              }}
            >
              <Pencil className="size-3 stroke-[1.5] text-custom-text-200" />
            </button>
          )}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="grid place-items-center p-1 hover:bg-custom-background-80"
          >
            <ExternalLink className="size-3 stroke-[1.5] text-custom-text-200" />
          </a>
          {isEditingAllowed && (
            <button
              type="button"
              className="grid place-items-center p-1 hover:bg-custom-background-80"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteLink();
              }}
            >
              <Trash2 className="size-3 stroke-[1.5] text-custom-text-200" />
            </button>
          )}
        </div>
      </div>
      <div className="px-5">
        <p className="mt-0.5 stroke-[1.5] text-xs text-custom-text-300">
          Added {calculateTimeAgo(link.created_at)}
          <br />
          {createdByDetails && (
            <>by {createdByDetails?.is_bot ? createdByDetails?.first_name + " Bot" : createdByDetails?.display_name}</>
          )}
        </p>
      </div>
    </div>
  );
});
