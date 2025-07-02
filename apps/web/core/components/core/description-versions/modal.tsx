import { useCallback, useRef } from "react";
import { observer } from "mobx-react";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
// plane imports
import { EditorReadOnlyRefApi } from "@plane/editor";
import { useTranslation } from "@plane/i18n";
import { TDescriptionVersion } from "@plane/types";
import {
  Avatar,
  Button,
  EModalPosition,
  EModalWidth,
  getButtonStyling,
  Loader,
  ModalCore,
  setToast,
  TOAST_TYPE,
  Tooltip,
} from "@plane/ui";
import { calculateTimeAgo, cn, copyTextToClipboard, getFileURL } from "@plane/utils";
// components
import { RichTextReadOnlyEditor } from "@/components/editor";
// hooks
import { useMember, useWorkspace } from "@/hooks/store";

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

export const DescriptionVersionsModal: React.FC<Props> = observer((props) => {
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
  const editorRef = useRef<EditorReadOnlyRefApi>(null);
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
    copyTextToClipboard(editorRef.current.getMarkDown()).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: "Markdown copied to clipboard.",
      })
    );
  }, [t]);

  if (!workspaceId) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXXXL}>
      <div className="p-4" data-prevent-outside-click>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 py-0.5">
          <div className="flex-shrink-0 flex items-center gap-2 text-sm">
            <p className="flex items-center gap-1">
              {t("description_versions.edited_by")}
              <span className="flex-shrink-0">
                <Avatar
                  size="sm"
                  src={getFileURL(versionCreator?.avatar_url ?? "")}
                  name={versionCreator?.display_name}
                />
              </span>
            </p>
            <p className="flex-shrink-0 text-custom-text-200">
              {calculateTimeAgo(activeVersionDetails?.last_saved_at ?? "")}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center">
            <button
              type="button"
              onClick={() => handleNavigation("prev")}
              className={cn(
                "size-6 text-custom-text-200 grid place-items-center rounded outline-none transition-colors",
                {
                  "hover:bg-custom-background-80": !isPrevDisabled,
                  "opacity-50": isPrevDisabled,
                }
              )}
              disabled={isPrevDisabled}
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => handleNavigation("next")}
              className={cn(
                "size-6 text-custom-text-200 grid place-items-center rounded outline-none transition-colors",
                {
                  "hover:bg-custom-background-80": !isNextDisabled,
                  "opacity-50": isNextDisabled,
                }
              )}
              disabled={isNextDisabled}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        {/* End header */}
        {/* Version description */}
        <div className="mt-4 pb-4">
          {activeVersionDescription ? (
            <RichTextReadOnlyEditor
              containerClassName="p-0 !pl-0 border-none"
              editorClassName="pl-0"
              id={activeVersionId ?? ""}
              initialValue={activeVersionDescription ?? "<p></p>"}
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
        </div>
        {/* End version description */}
        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-4 border-t-[0.5px] border-custom-border-200">
          <Tooltip tooltipContent={t("common.actions.copy_markdown")}>
            <button
              type="button"
              className={cn(
                "flex-shrink-0",
                getButtonStyling("neutral-primary", "sm"),
                "border-none grid place-items-center"
              )}
              onClick={handleCopyMarkdown}
            >
              <Copy className="size-4" />
            </button>
          </Tooltip>
          <div className="flex items-center gap-2">
            <Button variant="neutral-primary" size="sm" onClick={handleClose} tabIndex={1}>
              {t("common.cancel")}
            </Button>
            {!isRestoreDisabled && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleRestore(activeVersionDescription ?? "<p></p>");
                  handleClose();
                }}
              >
                {t("common.actions.restore")}
              </Button>
            )}
          </div>
        </div>
        {/* End footer */}
      </div>
    </ModalCore>
  );
});
