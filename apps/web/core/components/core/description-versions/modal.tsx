/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@makeplane/propel/components/avatar";
import type { EditorRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogInfo,
  DialogMain,
  DialogTitle,
  DialogToolbar,
} from "@makeplane/propel/components/dialog";
import { ChevronLeftOutline, ChevronRightOutline, CopyOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { TDescriptionVersion } from "@plane/types";
import { Loader } from "@plane/blocks/skeleton";
import { calculateTimeAgo, cn, getFileURL } from "@plane/utils";
// components
import { RichTextEditor } from "@/components/editor/rich-text";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";

type Props = {
  activeVersionDescription: string | undefined;
  activeVersionDetails: TDescriptionVersion | undefined;
  handleClose: () => void;
  handleNavigation: (direction: "prev" | "next") => void;
  handleRestore: (descriptionHTML: string) => void;
  isNextDisabled: boolean;
  isOpen: boolean;
  isPrevDisabled: boolean;
  isRestoreDisabled: boolean;
  projectId: string | undefined;
  workspaceSlug: string;
};

export const DescriptionVersionsModal = observer(function DescriptionVersionsModal(props: Props) {
  const {
    activeVersionDescription,
    activeVersionDetails,
    handleClose,
    handleNavigation,
    handleRestore,
    isNextDisabled,
    isPrevDisabled,
    isOpen,
    isRestoreDisabled,
    projectId,
    workspaceSlug,
  } = props;
  // refs
  const editorRef = useRef<EditorRefApi>(null);
  // store hooks
  const { getUserDetails } = useMember();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const activeVersionId = activeVersionDetails?.id;
  const workspaceId = getWorkspaceBySlug(workspaceSlug)?.id;
  const versionCreator = activeVersionDetails?.owned_by ? getUserDetails(activeVersionDetails.owned_by) : null;
  // translation
  const { t } = useTranslation();

  const handleCopyMarkdown = useCallback(() => {
    if (!editorRef.current) return;
    editorRef.current.copyMarkdownToClipboard();
    setToast({
      type: "success",
      title: t("toast.success"),
      message: "Markdown copied to clipboard.",
    });
  }, [t]);

  if (!workspaceId) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="lg" data-prevent-outside-click>
        {/* The visible header is the "edited by" meta row, so the dialog's accessible name is
            carried by a visually hidden title. */}
        <div className="sr-only">
          <DialogTitle>{t("page_navigation_pane.tabs.info.version_history.label")}</DialogTitle>
        </div>
        <DialogToolbar>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-shrink-0 items-center gap-2 text-13">
              <p className="flex items-center gap-1">
                {t("description_versions.edited_by")}
                <span className="flex-shrink-0">
                  <Avatar
                    alt={versionCreator?.display_name}
                    fallback={versionCreator?.display_name?.[0]?.toUpperCase()}
                    size="2xs"
                    src={getFileURL(versionCreator?.avatar_url ?? "")}
                  />
                </span>
              </p>
              <p className="flex-shrink-0 text-secondary">
                {calculateTimeAgo(activeVersionDetails?.last_saved_at ?? "")}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center">
              <button
                type="button"
                onClick={() => handleNavigation("prev")}
                className={cn(
                  "grid size-6 place-items-center rounded-sm text-secondary transition-colors outline-none",
                  {
                    "hover:bg-layer-1": !isPrevDisabled,
                    "opacity-50": isPrevDisabled,
                  }
                )}
                disabled={isPrevDisabled}
              >
                <ChevronLeftOutline className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => handleNavigation("next")}
                className={cn(
                  "grid size-6 place-items-center rounded-sm text-secondary transition-colors outline-none",
                  {
                    "hover:bg-layer-1": !isNextDisabled,
                    "opacity-50": isNextDisabled,
                  }
                )}
                disabled={isNextDisabled}
              >
                <ChevronRightOutline className="size-4" />
              </button>
            </div>
          </div>
        </DialogToolbar>
        <DialogMain>
          {/* Version description */}
          <DialogBody tabIndex={0}>
            {activeVersionId && activeVersionDescription ? (
              <RichTextEditor
                key={activeVersionId}
                editable={false}
                containerClassName="p-0 !pl-0 border-none"
                editorClassName="pl-0"
                id={activeVersionId}
                initialValue={activeVersionDescription}
                projectId={projectId}
                ref={editorRef}
                workspaceId={workspaceId}
                workspaceSlug={workspaceSlug}
              />
            ) : (
              <div className="space-y-1">
                <Loader.Item width="300px" height="15px" />
                <Loader.Item width="400px" height="15px" />
                <div className="flex items-center gap-2">
                  <Loader.Item width="20px" height="15px" />
                  <Loader.Item width="500px" height="15px" />
                </div>
                <div className="flex items-center gap-2">
                  <Loader.Item width="20px" height="15px" />
                  <Loader.Item width="200px" height="15px" />
                </div>
                <Loader.Item width="300px" height="15px" />
                <Loader.Item width="200px" height="15px" />
              </div>
            )}
          </DialogBody>
          {/* End version description */}
        </DialogMain>
        {/* Footer */}
        <DialogActions>
          <DialogInfo>
            <Tooltip label={t("common.actions.copy_markdown")}>
              <IconButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyMarkdown}
                icon={<Icon icon={CopyOutline} />}
                aria-label={t("common.actions.copy_markdown")}
              />
            </Tooltip>
          </DialogInfo>
          <Button
            variant="secondary"
            size="md"
            stretch="auto"
            label={t("common.cancel")}
            onClick={handleClose}
            tabIndex={0}
          />
          {!isRestoreDisabled && (
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              label={t("common.actions.restore")}
              onClick={() => {
                handleRestore(activeVersionDescription ?? "<p></p>");
                handleClose();
              }}
            />
          )}
        </DialogActions>
        {/* End footer */}
      </DialogContent>
    </Dialog>
  );
});
