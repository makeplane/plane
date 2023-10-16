import React from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// hooks
import useUser from "hooks/use-user";
import useToast from "hooks/use-toast";
// ui
import { CustomMenu } from "components/ui";
import { Tooltip } from "@plane/ui";
// icons
import { LinkIcon, LockClosedIcon, LockOpenIcon, PencilIcon, StarIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ExclamationIcon } from "components/icons";
// helpers
import { copyTextToClipboard, truncateText } from "helpers/string.helper";
import { render24HourFormatTime, renderShortDate, renderLongDateFormat } from "helpers/date-time.helper";
// types
import { IPage, IProjectMember } from "types";

type TSingleStatProps = {
  page: IPage;
  people: IProjectMember[] | undefined;
  handleEditPage: () => void;
  handleDeletePage: () => void;
  handleAddToFavorites: () => void;
  handleRemoveFromFavorites: () => void;
  partialUpdatePage: (page: IPage, formData: Partial<IPage>) => void;
};

export const SinglePageDetailedItem: React.FC<TSingleStatProps> = ({
  page,
  people,
  handleEditPage,
  handleDeletePage,
  handleAddToFavorites,
  handleRemoveFromFavorites,
  partialUpdatePage,
}) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUser();

  const { setToastAlert } = useToast();

  const handleCopyText = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/pages/${page.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Page link copied to clipboard.",
      });
    });
  };

  return (
    <div className="relative">
      <Link href={`/${workspaceSlug}/projects/${projectId}/pages/${page.id}`}>
        <a className="block p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="mr-2 truncate text-sm">{truncateText(page.name, 75)}</p>
              {page.label_details.length > 0 &&
                page.label_details.map((label) => (
                  <div
                    key={label.id}
                    className="group flex items-center gap-1 rounded-2xl border border-custom-border-200 px-2 py-0.5 text-xs"
                    style={{
                      backgroundColor: `${label?.color && label.color !== "" ? label.color : "#000000"}20`,
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
              <Tooltip
                tooltipContent={`Last updated at ${
                  render24HourFormatTime(page.updated_at) +
                  ` ${new Date(page.updated_at).getHours() < 12 ? "am" : "pm"}`
                } on ${renderShortDate(page.updated_at)}`}
              >
                <p className="text-sm text-custom-text-200">{render24HourFormatTime(page.updated_at)}</p>
              </Tooltip>
              {page.is_favorite ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveFromFavorites();
                  }}
                  className="z-10 grid place-items-center"
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
                  className="z-10 grid place-items-center"
                >
                  <StarIcon className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                </button>
              )}
              {page.created_by === user?.id && (
                <Tooltip
                  tooltipContent={`${
                    page.access
                      ? "This page is only visible to you."
                      : "This page can be viewed by anyone in the project."
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      partialUpdatePage(page, { access: page.access ? 0 : 1 });
                    }}
                  >
                    {page.access ? (
                      <LockClosedIcon className="h-4 w-4" color="rgb(var(--color-text-200))" />
                    ) : (
                      <LockOpenIcon className="h-4 w-4" color="rgb(var(--color-text-200))" />
                    )}
                  </button>
                </Tooltip>
              )}
              <Tooltip
                position="top-right"
                tooltipContent={`Created by ${
                  people?.find((person) => person.member.id === page.created_by)?.member.display_name ?? ""
                } on ${renderLongDateFormat(`${page.created_at}`)}`}
              >
                <span>
                  <ExclamationIcon className="h-4 w-4 fill-current text-custom-text-200" />
                </span>
              </Tooltip>
              <CustomMenu verticalEllipsis>
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
                <CustomMenu.MenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyText();
                  }}
                >
                  <div className="flex items-center justify-start gap-2">
                    <LinkIcon className="h-4 w-4" />
                    <span>Copy Page link</span>
                  </div>
                </CustomMenu.MenuItem>
              </CustomMenu>
            </div>
          </div>
          <div className="relative mt-2 space-y-2 text-sm text-custom-text-200">
            {page.blocks.length > 0 ? page.blocks.slice(0, 3).map((block) => <h4>{block.name}</h4>) : null}
          </div>
        </a>
      </Link>
    </div>
  );
};
