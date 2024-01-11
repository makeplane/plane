import { FC, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import {
  AlertCircle,
  Archive,
  ArchiveRestoreIcon,
  FileText,
  Globe2,
  LinkIcon,
  Lock,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// helpers
import { copyUrlToClipboard } from "helpers/string.helper";
import { renderFormattedTime, renderFormattedDate } from "helpers/date-time.helper";
// ui
import { CustomMenu, Tooltip } from "@plane/ui";
// components
import { CreateUpdatePageModal, DeletePageModal } from "components/pages";
// constants
import { EUserProjectRoles } from "constants/project";
import { IPageStore } from "store/page.store";
import { useRouter } from "next/router";
import { useProjectSpecificPages } from "hooks/store/use-project-specific-pages";

export interface IPagesListItem {
  pageId: string;
  projectId: string;
}

export const PagesListItem: FC<IPagesListItem> = observer(({ pageId, projectId }: IPagesListItem) => {
  const projectPageStore = useProjectSpecificPages(projectId);
  // Now, I am observing only the projectPages, out of the projectPageStore.
  const { projectPageMap } = projectPageStore;

  const pageStore = projectPageMap?.[projectId]?.[pageId];

  // states
  const router = useRouter();
  const { workspaceSlug } = router.query;
  const [createUpdatePageModal, setCreateUpdatePageModal] = useState(false);
  const [deletePageModal, setDeletePageModal] = useState(false);
  // store hooks
  // const {
  //   currentUser,
  //   membership: { currentProjectRole },
  // } = useUser();
  //
  //
  const currentProjectRole = 15;

  // const {
  //   getArchivedPageById,
  //   getUnArchivedPageById,
  //   archivePage,
  //   removeFromFavorites,
  //   addToFavorites,
  //   makePrivate,
  //   makePublic,
  //   restorePage,
  // } = usePage();
  // const {
  //   project: { getProjectMemberDetails },
  // } = useMember();
  // toast alert
  //

  const { setToastAlert } = useToast();
  // derived values
  // const pageDetails = getUnArchivedPageById(pageId) ?? getArchivedPageById(pageId);

  if (!pageStore) return null;

  const {
    archived_at,
    access,
    is_favorite,
    name,
    created_at,
    updated_at,
    makePublic,
    makePrivate,
    addToFavorites,
    removeFromFavorites,
  } = pageStore;

  const handleCopyUrl = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/pages/${pageId}`).then(() => {
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

    console.log("handleAddToFavorites");

    addToFavorites()
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

    removeFromFavorites()
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

    makePublic();
  };

  const handleMakePrivate = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    makePrivate();
  };

  const handleArchivePage = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    // TODO: implement archive page inside page store
    // archivePage(workspaceSlug, projectId, pageId);
  };

  const handleRestorePage = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    // restorePage(workspaceSlug, projectId, pageId);
  };

  const handleDeletePage = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    setDeletePageModal(true);
  };

  const handleEditPage = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    setCreateUpdatePageModal(true);
  };

  // if (!pageDetails) return null;

  // const ownerDetails = getProjectMemberDetails(owned_by);
  // const ownerDetails = useMemo(() => getProjectMemberDetails(owned_by), [owned_by, getProjectMemberDetails]);
  const ownerDetails = { member: { display_name: "test" } };

  // const isCurrentUserOwner = owned_by === currentUser?.id;
  const isCurrentUserOwner = true;

  const userCanEdit =
    isCurrentUserOwner ||
    (currentProjectRole && [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER].includes(currentProjectRole));
  const userCanChangeAccess = isCurrentUserOwner;
  const userCanArchive = isCurrentUserOwner || currentProjectRole === EUserProjectRoles.ADMIN;
  const userCanDelete = isCurrentUserOwner || currentProjectRole === EUserProjectRoles.ADMIN;
  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  return (
    <>
      {/**
      <CreateUpdatePageModal
        isOpen={createUpdatePageModal}
        handleClose={() => setCreateUpdatePageModal(false)}
        data={pageDetails}
        projectId={projectId}
      />
      <DeletePageModal isOpen={deletePageModal} onClose={() => setDeletePageModal(false)} data={pageDetails} />
      **/}
      <li>
        <Link href={`/${workspaceSlug}/projects/${projectId}/pages/${pageId}`}>
          <div className="relative rounded p-4 text-custom-text-200 hover:bg-custom-background-80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-4 w-4 shrink-0" />
                <p className="mr-2 truncate text-sm text-custom-text-100">{name}</p>
                {/** labels.length > 0 &&
                  labels.map(
                    (label) => label
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
                  ) **/}
              </div>
              <div className="flex items-center gap-2.5">
                {archived_at ? (
                  <Tooltip
                    tooltipContent={`Archived at ${renderFormattedTime(archived_at)} on ${renderFormattedDate(
                      archived_at
                    )}`}
                  >
                    <p className="text-sm text-custom-text-200">{renderFormattedTime(archived_at)}</p>
                  </Tooltip>
                ) : (
                  <Tooltip
                    tooltipContent={`Last updated at ${renderFormattedTime(updated_at)} on ${renderFormattedDate(
                      updated_at
                    )}`}
                  >
                    <p className="text-sm text-custom-text-200">{renderFormattedTime(updated_at)}</p>
                  </Tooltip>
                )}
                {isEditingAllowed && (
                  <Tooltip tooltipContent={`${is_favorite ? "Remove from favorites" : "Mark as favorite"}`}>
                    {is_favorite ? (
                      <button type="button" onClick={handleRemoveFromFavorites}>
                        <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                      </button>
                    ) : (
                      <button type="button" onClick={handleAddToFavorites}>
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </Tooltip>
                )}
                {userCanChangeAccess && (
                  <Tooltip
                    tooltipContent={`${
                      access ? "This page is only visible to you" : "This page can be viewed by anyone in the project"
                    }`}
                  >
                    {access ? (
                      <button type="button" onClick={handleMakePublic}>
                        <Lock className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button type="button" onClick={handleMakePrivate}>
                        <Globe2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </Tooltip>
                )}
                <Tooltip
                  position="top-right"
                  tooltipContent={`Created by ${ownerDetails?.member.display_name} on ${renderFormattedDate(
                    created_at
                  )}`}
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                </Tooltip>
                <CustomMenu width="auto" placement="bottom-end" className="!-m-1" verticalEllipsis>
                  {archived_at ? (
                    <>
                      {userCanArchive && (
                        <CustomMenu.MenuItem onClick={handleRestorePage}>
                          <div className="flex items-center gap-2">
                            <ArchiveRestoreIcon className="h-3 w-3" />
                            <span>Restore page</span>
                          </div>
                        </CustomMenu.MenuItem>
                      )}
                      {userCanDelete && isEditingAllowed && (
                        <CustomMenu.MenuItem onClick={handleDeletePage}>
                          <div className="flex items-center gap-2">
                            <Trash2 className="h-3 w-3" />
                            <span>Delete page</span>
                          </div>
                        </CustomMenu.MenuItem>
                      )}
                    </>
                  ) : (
                    <>
                      {userCanEdit && isEditingAllowed && (
                        <CustomMenu.MenuItem onClick={handleEditPage}>
                          <div className="flex items-center gap-2">
                            <Pencil className="h-3 w-3" />
                            <span>Edit page</span>
                          </div>
                        </CustomMenu.MenuItem>
                      )}
                      {userCanArchive && isEditingAllowed && (
                        <CustomMenu.MenuItem onClick={handleArchivePage}>
                          <div className="flex items-center gap-2">
                            <Archive className="h-3 w-3" />
                            <span>Archive page</span>
                          </div>
                        </CustomMenu.MenuItem>
                      )}
                    </>
                  )}
                  <CustomMenu.MenuItem onClick={handleCopyUrl}>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-3 w-3" />
                      <span>Copy page link</span>
                    </div>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              </div>
            </div>
          </div>
        </Link>
      </li>
    </>
  );
});
