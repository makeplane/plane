import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// ui
import { CustomMenu } from "components/ui";
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
  handleAddToFavorites: () => void;
  handleRemoveFromFavorites: () => void;
};

export const SinglePageDetailedItem: React.FC<TSingleStatProps> = ({
  page,
  handleEditPage,
  handleDeletePage,
  handleAddToFavorites,
  handleRemoveFromFavorites,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  return (
    <div className="relative rounded px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Link href={`/${workspaceSlug}/projects/${projectId}/pages/${page.id}`}>
            <a className="after:absolute after:inset-0">
              <p className="mr-2 truncate text-sm font-medium">{truncateText(page.name, 75)}</p>
            </a>
          </Link>
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
      <div className="relative mt-6 space-y-2 text-sm leading-relaxed text-gray-600">
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Reiciendis atque aliquam saepe
          sapiente illo ratione delectus dolorem repellat, id autem, molestiae neque quaerat ipsum
          perspiciatis pariatur? Unde consectetur quibusdam ut.
        </p>
        <div className="absolute bottom-0 h-24 w-full bg-gradient-to-t from-white" />
      </div>
    </div>
  );
};
