"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ArrowUpToLine, Clipboard } from "lucide-react";
// plane imports
import { TContextMenuItem, TOAST_TYPE, ToggleSwitch, setToast } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// components
import { ExportPageModal, PageActions, TPageActions } from "@/components/pages";
// hooks
import { usePageFilters } from "@/hooks/use-page-filters";
// plane web imports
import { EPageStoreType } from "@/plane-web/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageOptionsDropdown: React.FC<Props> = observer((props) => {
  const { page, storeType } = props;
  // states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  // store values
  const {
    name,
    isContentEditable,
    editor: { editorRef },
  } = page;
  // page filters
  const { isFullWidth, handleFullWidth, isStickyToolbarEnabled, handleStickyToolbar } = usePageFilters();
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
        key: "sticky-toolbar",
        action: () => handleStickyToolbar(!isStickyToolbarEnabled),
        customContent: (
          <>
            Sticky toolbar
            <ToggleSwitch value={isStickyToolbarEnabled} onChange={() => {}} />
          </>
        ),
        className: "flex items-center justify-between gap-2",
        shouldRender: isContentEditable,
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
        key: "export",
        action: () => setIsExportModalOpen(true),
        title: "Export",
        icon: ArrowUpToLine,
        shouldRender: true,
      },
    ],
    [editorRef, handleFullWidth, handleStickyToolbar, isContentEditable, isFullWidth, isStickyToolbarEnabled]
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
        editorRef={editorRef}
        extraOptions={EXTRA_MENU_OPTIONS}
        optionsOrder={[
          "full-screen",
          "sticky-toolbar",
          "make-a-copy",
          "toggle-access",
          "archive-restore",
          "delete",
          "version-history",
          "copy-markdown",
          "export",
        ]}
        page={page}
        storeType={storeType}
      />
    </>
  );
});
