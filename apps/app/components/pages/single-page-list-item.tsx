import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { mutate } from "swr";

// services
import pagesService from "services/pages.service";
// ui
import { CustomMenu } from "components/ui";
// icons
import { PencilIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { truncateText } from "helpers/string.helper";
// hooks
import useToast from "hooks/use-toast";
// types
import { IPage } from "types";
// fetch keys
import { PAGE_LIST } from "constants/fetch-keys";

type TSingleStatProps = {
  page: IPage;
  handleEditPage: () => void;
  handleDeletePage: () => void;
};

const Label: React.FC<any> = (props) => {
  let color = "bg-green-100 text-green-800";
  if (props.variant === "red") {
    color = "bg-red-100 text-red-800";
  } else if (props.variant === "blue") {
    color = "bg-blue-100 text-blue-800";
  }
  return (
    <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${color}`}>
      {props.children}
    </p>
  );
};

export const SinglePageListItem: React.FC<TSingleStatProps> = (props) => {
  const { page, handleEditPage, handleDeletePage } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleAddToFavorites = () => {
    if (!workspaceSlug && !projectId && !page) return;

    pagesService
      .addPageToFavorites(workspaceSlug as string, projectId as string, {
        page: page.id,
      })
      .then(() => {
        mutate<IPage[]>(
          PAGE_LIST(projectId as string),
          (prevData) =>
            (prevData ?? []).map((m) => ({
              ...m,
              is_favorite: m.id === page.id ? true : m.is_favorite,
            })),
          false
        );
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully added the page to favorites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't add the page to favorites. Please try again.",
        });
      });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug || !page) return;

    pagesService
      .removePageFromFavorites(workspaceSlug as string, projectId as string, page.id)
      .then(() => {
        mutate<IPage[]>(
          PAGE_LIST(projectId as string),
          (prevData) =>
            (prevData ?? []).map((m) => ({
              ...m,
              is_favorite: m.id === page.id ? false : m.is_favorite,
            })),
          false
        );
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Successfully removed the page from favorites.",
        });
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Couldn't remove the page from favorites. Please try again.",
        });
      });
  };

  return (
    <div>
      <li>
        <div className="relative px-4 py-4 hover:bg-gray-50 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Link href={`/${workspaceSlug}/projects/${projectId}/pages/${page.id}`}>
                <a className="after:absolute after:inset-0">
                  <p className="mr-2 truncate text-sm font-medium">{truncateText(page.name, 75)}</p>
                </a>
              </Link>
              <Label variant="green">Meetings</Label>
              <Label variant="red">Standup</Label>
              <Label variant="blue">Plans</Label>
            </div>
            <div className="ml-2 flex flex-shrink-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-400">
                  {new Date(page.updated_at).toLocaleTimeString()}
                </p>
                {page.is_favorite ? (
                  <button onClick={handleRemoveFromFavorites} className="z-10">
                    <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                  </button>
                ) : (
                  <button onClick={handleAddToFavorites} type="button" className="z-10">
                    <StarIcon className="h-4 w-4 " color="#858E96" />
                  </button>
                )}
                <CustomMenu width="auto" verticalEllipsis>
                  <CustomMenu.MenuItem onClick={handleEditPage}>
                    <span className="flex items-center justify-start gap-2 text-gray-800">
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit Page</span>
                    </span>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem onClick={handleDeletePage}>
                    <span className="flex items-center justify-start gap-2 text-gray-800">
                      <TrashIcon className="h-4 w-4" />
                      <span>Delete Page</span>
                    </span>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
          </div>
        </div>
      </li>
    </div>
  );
};
