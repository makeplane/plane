import { observer } from "mobx-react";
// icons
import { Pencil, Trash2, LinkIcon } from "lucide-react";
import { ILinkDetails, UserAuth } from "@plane/types";
// ui
import { ExternalLinkIcon, Tooltip, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { calculateTimeAgo } from "@/helpers/date-time.helper";
// hooks
import { useMember } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types

type Props = {
  links: ILinkDetails[];
  handleDeleteLink: (linkId: string) => void;
  handleEditLink: (link: ILinkDetails) => void;
  userAuth: UserAuth;
  disabled?: boolean;
};

export const LinksList: React.FC<Props> = observer(({ links, handleDeleteLink, handleEditLink, userAuth, disabled }) => {
  const { getUserDetails } = useMember();
  const { isMobile } = usePlatformOS();
  const isNotAllowed = userAuth.isGuest || userAuth.isViewer || disabled;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setToast({
      type: TOAST_TYPE.SUCCESS,
      title: "Copied to clipboard",
      message: "The URL has been successfully copied to your clipboard",
    });
  };

  return (
    <>
      {links.map((link) => {
        const createdByDetails = getUserDetails(link.created_by);
        return (
          <div key={link.id} className="relative flex flex-col rounded-md bg-custom-background-90 p-2.5">
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

              {!isNotAllowed && (
                <div className="z-[1] flex flex-shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="flex items-center justify-center p-1 hover:bg-custom-background-80"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditLink(link);
                    }}
                  >
                    <Pencil className="h-3 w-3 stroke-[1.5] text-custom-text-200" />
                  </button>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center p-1 hover:bg-custom-background-80"
                  >
                    <ExternalLinkIcon className="h-3 w-3 stroke-[1.5] text-custom-text-200" />
                  </a>
                  <button
                    type="button"
                    className="flex items-center justify-center p-1 hover:bg-custom-background-80"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteLink(link.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <div className="px-5">
              <p className="mt-0.5 stroke-[1.5] text-xs text-custom-text-300">
                Added {calculateTimeAgo(link.created_at)}
                <br />
                {createdByDetails && (
                  <>
                    by{" "}
                    {createdByDetails?.is_bot ? createdByDetails?.first_name + " Bot" : createdByDetails?.display_name}
                  </>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </>
  );
});
