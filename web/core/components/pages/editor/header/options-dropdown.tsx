"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
import { ArrowUpToLine, Clipboard, History } from "lucide-react";
// document editor
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/editor";
// ui
import { TContextMenuItem, TOAST_TYPE, setToast, ToggleSwitch } from "@plane/ui";
// components
import { ExportPageModal, PageActions, TPageActions } from "@/components/pages";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
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
  // states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // router
  const router = useRouter();
  // derived values
  const { name } = page;
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
        page={page}
      />
    </>
  );
});
