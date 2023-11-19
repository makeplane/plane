import { FC, useState } from "react";
import Link from "next/link";
// icons
import {
  AlertCircle,
  ArchiveRestoreIcon,
  FileLock2,
  FileText,
  Globe,
  LinkIcon,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
import { useMobxStore } from "lib/mobx/store-provider";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { renderShortDate, render24HourFormatTime, renderLongDateFormat } from "helpers/date-time.helper";
// ui
import { CustomMenu, Tooltip } from "@plane/ui";
// components
import { CreateUpdatePageModal, ArchivePageModal } from "components/pages";
// types
import { IPage } from "types";
import { observer } from "mobx-react-lite";

export interface IPagesListItem {
  workspaceSlug: string;
  projectId: string;
  page: IPage;
}

export const PagesListItem: FC<IPagesListItem> = observer((props) => {
  const { workspaceSlug, projectId, page } = props;
  // states
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);
  const [archivePageModal, setArchivePageModal] = useState(false);
  // store
  const {
    page: { removeFromFavorites, addToFavorites, makePublic, makePrivate, archivePage, restorePage },
    user: { currentUser },
    projectMember: { projectMembers },
  } = useMobxStore();
  // hooks
  const { setToastAlert } = useToast();

  const handleCopyText = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${projectId}/pages/${page.id}`).then(() => {
      setToastAlert({
        type: "success",
        title: "Link Copied!",
        message: "Page link copied to clipboard.",
      });
    });
  };

  const handleAddToFavorites = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    addToFavorites(workspaceSlug, projectId, page.id)
      .then(() => {
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

  const handleRemoveFromFavorites = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    removeFromFavorites(workspaceSlug, projectId, page.id)
      .then(() => {
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

  const handleMakePublic = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    makePublic(workspaceSlug, projectId, page.id);
  };

  const handleMakePrivate = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    makePrivate(workspaceSlug, projectId, page.id);
  };

  const handleArchivePage = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    archivePage(workspaceSlug, projectId, page.id);
  };

  const handleRestorePage = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    restorePage(workspaceSlug, projectId, page.id);
  };

  const handleEditPageModal = (e: any) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      {currentUser && (
        <>
          <CreateUpdatePageModal
            isOpen={createUpdatePageModal}
            handleClose={() => setCreateUpdatePageModal(false)}
            data={page}
            user={currentUser}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
          <ArchivePageModal isOpen={archivePageModal} setIsOpen={setArchivePageModal} data={page} user={currentUser} />
        </>
      )}
      <li>
        <Link href={`/${workspaceSlug}/projects/${projectId}/pages/${page.id}`}>
          <a>
            <div className="relative rounded p-4 text-custom-text-200 hover:bg-custom-background-80">
              <div className="flex items-center justify-between">
                <div className="flex overflow-hidden items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0" />
                  <p className="mr-2 truncate text-sm text-custom-text-100">{page.name}</p>
                  {page.label_details.length > 0 &&
                    page.label_details.map((label) => (
                      <div
                        key={label.id}
                        className="group flex items-center gap-1 rounded-2xl border border-custom-border-200 px-2 py-0.5 text-xs"
                        style={{
                          backgroundColor: `${label?.color}20`,
                        }}
                      >
                        <span
                          className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{
                            backgroundColor: label?.color,
                          }}
                        />
                        {label.name}
                      </div>
                    ))}
                </div>
                <div className="ml-2 flex flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {page.archived_at ? (
                      <Tooltip
                        tooltipContent={`Archived at ${render24HourFormatTime(page.archived_at)} on ${renderShortDate(
                          page.archived_at
                        )}`}
                      >
                        <p className="text-sm text-custom-text-200">{render24HourFormatTime(page.archived_at)}</p>
                      </Tooltip>
                    ) : (
                      <Tooltip
                        tooltipContent={`Last updated at ${render24HourFormatTime(
                          page.updated_at
                        )} on ${renderShortDate(page.updated_at)}`}
                      >
                        <p className="text-sm text-custom-text-200">{render24HourFormatTime(page.updated_at)}</p>
                      </Tooltip>
                    )}
                    {!page.archived_at &&
                      (page.is_favorite ? (
                        <button type="button" onClick={handleRemoveFromFavorites}>
                          <Star className="h-4 w-4 text-orange-400" fill="#f6ad55" />
                        </button>
                      ) : (
                        <button type="button" onClick={handleAddToFavorites}>
                          <Star className="h-4 w-4 " color="rgb(var(--color-text-200))" />
                        </button>
                      ))}
                    {page.created_by === currentUser?.id && !page.archived_at && (
                      <Tooltip
                        tooltipContent={`${
                          page.access
                            ? "This page is only visible to you."
                            : "This page can be viewed by anyone in the project."
                        }`}
                      >
                        {page.access ? (
                          <button type="button" onClick={handleMakePublic}>
                            <FileLock2 className="h-4 w-4" color="rgb(var(--color-text-200))" />
                          </button>
                        ) : (
                          <button type="button" onClick={handleMakePrivate}>
                            <Globe className="h-4 w-4" color="rgb(var(--color-text-200))" />
                          </button>
                        )}
                      </Tooltip>
                    )}
                    <Tooltip
                      position="top-right"
                      tooltipContent={`Created by ${
                        projectMembers?.find((projectMember) => projectMember.member.id === page.created_by)?.member
                          .display_name ?? ""
                      } on ${renderLongDateFormat(`${page.created_at}`)}`}
                    >
                      <span>
                        <AlertCircle className="h-4 w-4 text-custom-text-200" />
                      </span>
                    </Tooltip>

                    {!page.archived_at && (
                      <CustomMenu width="auto" verticalEllipsis>
                        {currentUser && currentUser.id == page.owned_by && (
                          <CustomMenu.MenuItem onClick={handleEditPageModal}>
                            <span className="flex items-center justify-start gap-2">
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit Page</span>
                            </span>
                          </CustomMenu.MenuItem>
                        )}
                        {currentUser && currentUser.id == page.owned_by && (
                          <CustomMenu.MenuItem onClick={handleArchivePage}>
                            <span className="flex items-center justify-start gap-2">
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Archive Page</span>
                            </span>
                          </CustomMenu.MenuItem>
                        )}
                        <CustomMenu.MenuItem onClick={handleCopyText}>
                          <div className="flex items-center justify-start gap-2">
                            <LinkIcon className="h-4 w-4" />
                            <span>Copy Page link</span>
                          </div>
                        </CustomMenu.MenuItem>
                      </CustomMenu>
                    )}
                    {page.archived_at && currentUser && currentUser.id === page.owned_by && (
                      <CustomMenu verticalEllipsis>
                        <CustomMenu.MenuItem onClick={handleRestorePage}>
                          <span className="flex items-center justify-start gap-2">
                            <ArchiveRestoreIcon className="h-3.5 w-3.5" />
                            <span>Restore Page</span>
                          </span>
                        </CustomMenu.MenuItem>
                      </CustomMenu>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </a>
        </Link>
      </li>
    </>
  );
});
