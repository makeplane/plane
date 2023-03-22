import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";

// ui
import { CustomMenu, Tooltip } from "components/ui";
// icons
import { PencilIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { truncateText } from "helpers/string.helper";
// types
import { IPage } from "types";

type TSingleStatProps = {
  page: IPage;
  handleEditPage: () => void;
  handleDeletePage: () => void;
};

export const SinglePageCard: React.FC<TSingleStatProps> = (props) => {
  const { page, handleEditPage, handleDeletePage } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const handleAddToFavorites = () => {};

  const handleRemoveFromFavorites = () => {};

  return (
    <div>
      <div className="flex flex-col rounded bg-white text-xs shadow-sm">
        <div className="flex h-full flex-col gap-4 rounded-b-[10px] p-4">
          <div className="flex items-start justify-between gap-1">
            <Tooltip tooltipContent={page.name} position="top-left">
              <div>
                <Link href={`/${workspaceSlug}/projects/${projectId}/pages/${page.id}`}>
                  <a className="w-full">
                    <h3 className="break-all text-lg font-semibold">
                      {truncateText(page.name, 75)}
                    </h3>
                  </a>
                </Link>
              </div>
            </Tooltip>
            <div className="flex">
              {page.is_favorite ? (
                <button onClick={handleRemoveFromFavorites}>
                  <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                </button>
              ) : (
                <button onClick={handleAddToFavorites}>
                  <StarIcon className="h-4 w-4 " color="#858E96" />
                </button>
              )}
              <CustomMenu width="auto" verticalEllipsis>
                <CustomMenu.MenuItem onClick={handleEditPage}>
                  <span className="flex items-center justify-start gap-2 text-gray-800">
                    <PencilIcon className="h-4 w-4" />
                    <span>Edit</span>
                  </span>
                </CustomMenu.MenuItem>
                <CustomMenu.MenuItem onClick={handleDeletePage}>
                  <span className="flex items-center justify-start gap-2 text-gray-800">
                    <TrashIcon className="h-4 w-4" />
                    <span>Delete</span>
                  </span>
                </CustomMenu.MenuItem>
              </CustomMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
