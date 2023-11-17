// icons
import { ExternalLinkIcon } from "@plane/ui";
import { Pencil, Trash2, LinkIcon } from "lucide-react";
// helpers
import { timeAgo } from "helpers/date-time.helper";
// types
import { linkDetails, UserAuth } from "types";

type Props = {
  links: linkDetails[];
  handleDeleteLink: (linkId: string) => void;
  handleEditLink: (link: linkDetails) => void;
  userAuth: UserAuth;
};

export const LinksList: React.FC<Props> = ({ links, handleDeleteLink, handleEditLink, userAuth }) => {
  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <>
      {links.map((link) => (
        <div key={link.id} className="relative flex flex-col rounded-md bg-custom-background-90 p-2.5">
          <div className="flex items-start justify-between gap-2 w-full">
            <div className="flex items-start gap-2">
              <span className="py-1">
                <LinkIcon className="h-3 w-3 flex-shrink-0" />
              </span>
              <span className="text-xs break-all">{link.title && link.title !== "" ? link.title : link.url}</span>
            </div>

            {!isNotAllowed && (
              <div className="flex items-center gap-2 flex-shrink-0 z-[1]">
                <button
                  type="button"
                  className="flex items-center justify-center p-1 hover:bg-custom-background-80"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditLink(link);
                  }}
                >
                  <Pencil className="h-3 w-3 text-custom-text-200 stroke-[1.5]" />
                </button>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center p-1 hover:bg-custom-background-80"
                >
                  <ExternalLinkIcon className="h-3 w-3 text-custom-text-200 stroke-[1.5]" />
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
            <p className="text-xs mt-0.5 text-custom-text-300 stroke-[1.5]">
              Added {timeAgo(link.created_at)}
              <br />
              by{" "}
              {link.created_by_detail.is_bot
                ? link.created_by_detail.first_name + " Bot"
                : link.created_by_detail.display_name}
            </p>
          </div>
        </div>
      ))}
    </>
  );
};
