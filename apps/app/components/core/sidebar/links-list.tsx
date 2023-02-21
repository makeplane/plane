import Link from "next/link";

// icons
import { LinkIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { timeAgo } from "helpers/date-time.helper";
// types
import { IUserLite, UserAuth } from "types";

type Props = {
  links: {
    id: string;
    created_at: Date;
    created_by: string;
    created_by_detail: IUserLite;
    title: string;
    url: string;
  }[];
  handleDeleteLink: (linkId: string) => void;
  userAuth: UserAuth;
};

export const LinksList: React.FC<Props> = ({ links, handleDeleteLink, userAuth }) => {
  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <>
      {links.map((link) => (
        <div key={link.id} className="group relative">
          {!isNotAllowed && (
            <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100">
              <button
                type="button"
                className="grid h-7 w-7 place-items-center rounded bg-gray-100 p-1 text-red-500 outline-none duration-300 hover:bg-red-50"
                onClick={() => handleDeleteLink(link.id)}
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          )}
          <Link href={link.url} target="_blank">
            <a className="group relative flex gap-2 rounded-md border bg-gray-100 p-2">
              <div className="mt-0.5">
                <LinkIcon className="h-3.5 w-3.5" />
              </div>
              <div>
                <h5>{link.title}</h5>
                {/* <p className="mt-0.5 text-gray-500">
                Added {timeAgo(link.created_at)} ago by {link.created_by_detail.email}
              </p> */}
              </div>
            </a>
          </Link>
        </div>
      ))}
    </>
  );
};
