// icons
import { ArrowTopRightOnSquareIcon, LinkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Icon } from "components/ui";
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

export const LinksList: React.FC<Props> = ({
  links,
  handleDeleteLink,
  handleEditLink,
  userAuth,
}) => {
  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <>
      {links.map((link) => (
        <div key={link.id} className="relative">
          {!isNotAllowed && (
            <div className="absolute top-1.5 right-1.5 z-[1] flex items-center gap-1">
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded bg-custom-background-90 p-1 outline-none hover:bg-custom-background-80"
                onClick={() => handleEditLink(link)}
              >
                <Icon iconName="edit" className="text-custom-text-200" />
              </button>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid h-7 w-7 place-items-center rounded bg-custom-background-90 p-1 outline-none hover:bg-custom-background-80"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4 text-custom-text-200" />
              </a>
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded bg-custom-background-90 p-1 text-red-500 outline-none duration-300 hover:bg-red-500/20"
                onClick={() => handleDeleteLink(link.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex gap-2 rounded-md bg-custom-background-90 p-2"
          >
            <div className="mt-0.5">
              <LinkIcon className="h-3.5 w-3.5" />
            </div>
            <div>
              <h5 className="w-4/5 break-words">{link.title ?? link.url}</h5>
              <p className="mt-0.5 text-custom-text-200">
                Added {timeAgo(link.created_at)}
                <br />
                by{" "}
                {link.created_by_detail.is_bot
                  ? link.created_by_detail.first_name + " Bot"
                  : link.created_by_detail.display_name}
              </p>
            </div>
          </a>
        </div>
      ))}
    </>
  );
};
