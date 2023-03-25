import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

// ui
import { CustomMenu, Loader } from "components/ui";
// icons
import { PencilIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { truncateText } from "helpers/string.helper";
import { renderShortTime } from "helpers/date-time.helper";
// types
import { IPage } from "types";

type TSingleStatProps = {
  page: IPage;
  handleEditPage: () => void;
  handleDeletePage: () => void;
  handleAddToFavorites: () => void;
  handleRemoveFromFavorites: () => void;
};

const RemirrorRichTextEditor = dynamic(() => import("components/rich-text-editor"), {
  ssr: false,
  loading: () => (
    <Loader className="p-4">
      <Loader.Item height="100px" width="100%" />
    </Loader>
  ),
});

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
    <div className="relative rounded border p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Link href={`/${workspaceSlug}/projects/${projectId}/pages/${page.id}`}>
            <a className="after:absolute after:inset-0">
              <p className="mr-2 truncate text-sm font-medium">{truncateText(page.name, 75)}</p>
            </a>
          </Link>
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
                    backgroundColor: label?.color && label.color !== "" ? label.color : "#000000",
                  }}
                />
                {label.name}
              </div>
            ))}
        </div>

        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-400">{renderShortTime(page.updated_at)}</p>
          {page.is_favorite ? (
            <button onClick={handleRemoveFromFavorites} className="z-10 grid place-items-center">
              <StarIcon className="h-4 w-4 text-orange-400" fill="#f6ad55" />
            </button>
          ) : (
            <button
              onClick={handleAddToFavorites}
              type="button"
              className="z-10 grid place-items-center"
            >
              <StarIcon className="h-4 w-4 " color="#858E96" />
            </button>
          )}
          <CustomMenu verticalEllipsis>
            <CustomMenu.MenuItem onClick={handleEditPage}>
              <span className="flex items-center justify-start gap-2 text-gray-800">
                <PencilIcon className="h-3.5 w-3.5" />
                <span>Edit Page</span>
              </span>
            </CustomMenu.MenuItem>
            <CustomMenu.MenuItem onClick={handleDeletePage}>
              <span className="flex items-center justify-start gap-2 text-gray-800">
                <TrashIcon className="h-3.5 w-3.5" />
                <span>Delete Page</span>
              </span>
            </CustomMenu.MenuItem>
          </CustomMenu>
        </div>
      </div>
      <div className="relative mt-6 space-y-2 text-sm text-gray-600">
        <div className="page-block-section -m-4 -mt-6">
          {page.blocks.length > 0 ? (
            <RemirrorRichTextEditor
              value={
                !page.blocks[0].description ||
                (typeof page.blocks[0].description === "object" &&
                  Object.keys(page.blocks[0].description).length === 0)
                  ? page.blocks[0].description_html
                  : page.blocks[0].description
              }
              editable={false}
              customClassName="text-gray-500"
              noBorder
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
