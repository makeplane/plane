import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// ui
import { CustomMenu, Tooltip } from "components/ui";
// icons
import { DocumentTextIcon, PencilIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { truncateText } from "helpers/string.helper";
import { renderShortDate, renderShortTime } from "helpers/date-time.helper";
// types
import { IPage } from "types";

type TSingleStatProps = {
  page: IPage;
  handleEditPage: () => void;
  handleDeletePage: () => void;
  handleAddToFavorites: () => void;
  handleRemoveFromFavorites: () => void;
};

export const SinglePageListItem: React.FC<TSingleStatProps> = ({
  page,
  handleEditPage,
  handleDeletePage,
  handleAddToFavorites,
  handleRemoveFromFavorites,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  return (
    <li>
      <Link href={`/${workspaceSlug}/projects/${projectId}/pages/${page.id}`}>
        <a>
          <div className="relative rounded p-4 hover:bg-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DocumentTextIcon className="h-4 w-4" />
                <p className="mr-2 truncate text-sm font-medium">{truncateText(page.name, 75)}</p>
                {page.label_details.length > 0 &&
                  page.label_details.map((label) => (
                    <div
                      key={label.id}
                      className="group flex items-center gap-1 rounded-2xl border px-2 py-0.5 text-xs"
                      style={{
                        backgroundColor: `${
                          label?.color && label.color !== "" ? label.color : "#000000"
                        }20`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            label?.color && label.color !== "" ? label.color : "#000000",
                        }}
                      />
                      {label.name}
                    </div>
                  ))}
              </div>
              <div className="ml-2 flex flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Tooltip
                    tooltipContent={`Last updated at ${renderShortTime(
                      page.updated_at
                    )} ${renderShortDate(page.updated_at)}`}
                  >
                    <p className="text-sm text-gray-400">{renderShortTime(page.updated_at)}</p>
                  </Tooltip>
                  {page.is_favorite ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFromFavorites();
                      }}
                    >
                      <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddToFavorites();
                      }}
                    >
                      <StarIcon className="h-4 w-4 " color="#858e96" />
                    </button>
                  )}
                  <CustomMenu width="auto" verticalEllipsis>
                    <CustomMenu.MenuItem
                      onClick={(e: any) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditPage();
                      }}
                    >
                      <span className="flex items-center justify-start gap-2">
                        <PencilIcon className="h-3.5 w-3.5" />
                        <span>Edit Page</span>
                      </span>
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem
                      onClick={(e: any) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeletePage();
                      }}
                    >
                      <span className="flex items-center justify-start gap-2">
                        <TrashIcon className="h-3.5 w-3.5" />
                        <span>Delete Page</span>
                      </span>
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              </div>
            </div>
          </div>
        </a>
      </Link>
    </li>
  );
};
