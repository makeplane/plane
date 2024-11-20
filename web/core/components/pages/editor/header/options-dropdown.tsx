"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { ArrowUpToLine, Clipboard, History } from "lucide-react";
// document editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// ui
import { TContextMenuItem, TOAST_TYPE, setToast, ToggleSwitch } from "@plane/ui";
// components
import { ExportPageModal, PageActions, TPageActions, TPageConfig, TPageOperations } from "@/components/pages";
// helpers
import { copyTextToClipboard, copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
import { useQueryParams } from "@/hooks/use-query-params";
// store
import { IPage } from "@/store/pages/page";

type Props = {
  editorRef: EditorRefApi | EditorReadOnlyRefApi | null;
  page: IPage;
};

export const PageOptionsDropdown: React.FC<Props> = observer((props) => {
  const { editorRef, page } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = useParams();
  // store values
  const {
    access,
    archive,
    archived_at,
    canCurrentUserArchivePage,
    canCurrentUserChangeAccess,
    canCurrentUserDeletePage,
    canCurrentUserDuplicatePage,
    canCurrentUserLockPage,
    canCurrentUserMovePage,
    duplicate,
    lock,
    id,
    is_locked,
    makePrivate,
    makePublic,
    name,
    restore,
    unlock,
  } = page;
  // states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // page filters
  const { isFullWidth, handleFullWidth } = usePageFilters();
  // update query params
  const { updateQueryParams } = useQueryParams();
  // menu items list
  const EXTRA_MENU_OPTIONS: (TContextMenuItem & { key: TPageActions })[] = useMemo(
    () => [
      {
        key: "full-screen",
        action: () => handleFullWidth(!isFullWidth),
        customContent: (
          <>
            Full width
            <ToggleSwitch value={isFullWidth} onChange={() => {}} />
          </>
        ),
        className: "flex items-center justify-between gap-2",
      },
      {
        key: "copy-markdown",
        action: () => {
          if (!editorRef) return;
          copyTextToClipboard(editorRef.getMarkDown()).then(() =>
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Markdown copied to clipboard.",
            })
          );
        },
        title: "Copy markdown",
        icon: Clipboard,
        shouldRender: true,
      },
      {
        key: "version-history",
        action: () => {
          // add query param, version=current to the route
          const updatedRoute = updateQueryParams({
            paramsToAdd: { version: "current" },
          });
          router.push(updatedRoute);
        },
        title: "Version history",
        icon: History,
        shouldRender: true,
      },
      {
        key: "export",
        action: () => setIsExportModalOpen(true),
        title: "Export",
        icon: ArrowUpToLine,
        shouldRender: true,
      },
    ],
    [editorRef, handleFullWidth, isFullWidth, router, updateQueryParams]
  );

  const pageOperations: TPageOperations = useMemo(() => {
    const pageLink = projectId ? `${workspaceSlug}/projects/${projectId}/pages/${id}` : `${workspaceSlug}/pages/${id}`;

    return {
      copyLink: () => {
        copyUrlToClipboard(pageLink).then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Link Copied!",
            message: "Page link copied to clipboard.",
          });
        });
      },
      duplicate: async () => {
        try {
          await duplicate();
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Page duplicated successfully.",
          });
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Page could not be duplicated. Please try again later.",
          });
        }
      },
      move: async () => {},
      openInNewTab: () => window.open(`/${pageLink}`, "_blank"),
      toggleAccess: async () => {
        const changedPageType = access === 0 ? "private" : "public";
        try {
          if (access === 0) await makePrivate();
          else await makePublic();

          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `The page has been marked ${changedPageType} and moved to the ${changedPageType} section.`,
          });
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: `The page couldn't be marked ${changedPageType}. Please try again.`,
          });
        }
      },
      toggleArchive: async () => {
        if (archived_at) {
          try {
            await restore();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page restored successfully.",
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be restored. Please try again later.",
            });
          }
        } else {
          try {
            await archive();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page archived successfully.",
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be archived. Please try again later.",
            });
          }
        }
      },
      toggleLock: async () => {
        if (is_locked) {
          try {
            await unlock();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page unlocked successfully.",
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be unlocked. Please try again later.",
            });
          }
        } else {
          try {
            await lock();
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: "Page locked successfully.",
            });
          } catch {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: "Page could not be locked. Please try again later.",
            });
          }
        }
      },
    };
  }, [
    access,
    archive,
    archived_at,
    duplicate,
    id,
    is_locked,
    lock,
    makePrivate,
    makePublic,
    projectId,
    restore,
    unlock,
    workspaceSlug,
  ]);
  const pageConfig: TPageConfig = useMemo(
    () => ({
      canArchive: canCurrentUserArchivePage,
      canLock: canCurrentUserLockPage,
      canMove: canCurrentUserMovePage,
      canToggleAccess: canCurrentUserChangeAccess && !archived_at,
      canDelete: canCurrentUserDeletePage && !!archived_at,
      canDuplicate: canCurrentUserDuplicatePage,
      isArchived: !!archived_at,
      isLocked: is_locked,
      pageAccess: access ?? 0,
    }),
    [
      access,
      archived_at,
      canCurrentUserArchivePage,
      canCurrentUserChangeAccess,
      canCurrentUserDeletePage,
      canCurrentUserDuplicatePage,
      canCurrentUserLockPage,
      canCurrentUserMovePage,
      is_locked,
    ]
  );

  return (
    <>
      <ExportPageModal
        editorRef={editorRef}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        pageTitle={name ?? ""}
      />
      <PageActions
        extraOptions={EXTRA_MENU_OPTIONS}
        optionsOrder={[
          "full-screen",
          "copy-markdown",
          "copy-link",
          "make-a-copy",
          "move",
          "archive-restore",
          "delete",
          "version-history",
          "export",
        ]}
        pageConfig={pageConfig}
        page={page}
        pageOperations={pageOperations}
      />
    </>
  );
});
