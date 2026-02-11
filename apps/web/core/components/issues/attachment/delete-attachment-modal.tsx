import type { FC } from "react";
import { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
// plane-i18n
import { useTranslation } from "@plane/i18n";
// types
import type { TIssueServiceType } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
// ui
import { AlertModalCore } from "@plane/ui";
// helper
import { getFileName } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { MediaLibraryService } from "@/services/media-library.service";
// types
import type { TAttachmentOperations } from "../issue-detail-widgets/attachments/helper";
import { buildArtifactName, resolveAttachmentFileName } from "../issue-detail-widgets/media-library-utils";

export type TAttachmentOperationsRemoveModal = Pick<TAttachmentOperations, "remove">;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  attachmentId: string;
  attachmentOperations: TAttachmentOperationsRemoveModal;
  workspaceSlug?: string;
  projectId?: string;
  confirmManifestOnDelete?: boolean;
  issueServiceType?: TIssueServiceType;
};

export const IssueAttachmentDeleteModal: FC<Props> = observer((props) => {
  const { t } = useTranslation();
  const {
    isOpen,
    onClose,
    attachmentId,
    attachmentOperations,
    workspaceSlug,
    projectId,
    confirmManifestOnDelete = false,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;
  // states
  const [loader, setLoader] = useState(false);
  const [removeFromManifest, setRemoveFromManifest] = useState(true);
  const [hasMediaLibraryArtifact, setHasMediaLibraryArtifact] = useState(false);
  const [isMediaLibraryCheckLoading, setIsMediaLibraryCheckLoading] = useState(false);
  const mediaLibraryService = useMemo(() => new MediaLibraryService(), []);

  // store hooks
  const {
    attachment: { getAttachmentById },
  } = useIssueDetail(issueServiceType);

  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;
  const artifactName = attachment ? buildArtifactName(resolveAttachmentFileName(attachment), attachment.id) : "";

  useEffect(() => {
    if (isOpen) {
      setRemoveFromManifest(true);
    } else {
      setHasMediaLibraryArtifact(false);
      setIsMediaLibraryCheckLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (!confirmManifestOnDelete || !workspaceSlug || !projectId || !artifactName) {
      setHasMediaLibraryArtifact(false);
      setIsMediaLibraryCheckLoading(false);
      return;
    }

    let isMounted = true;
    setIsMediaLibraryCheckLoading(true);
    setHasMediaLibraryArtifact(false);

    const checkManifestArtifact = async () => {
      try {
        const manifest = await mediaLibraryService.ensureProjectLibrary(workspaceSlug, projectId);
        const packageId = typeof manifest?.id === "string" ? manifest.id : null;
        if (!packageId) return;
        await mediaLibraryService.getArtifactDetail(workspaceSlug, projectId, packageId, artifactName);
        if (isMounted) setHasMediaLibraryArtifact(true);
      } catch {
        if (isMounted) setHasMediaLibraryArtifact(false);
      } finally {
        if (isMounted) setIsMediaLibraryCheckLoading(false);
      }
    };

    void checkManifestArtifact();

    return () => {
      isMounted = false;
    };
  }, [artifactName, confirmManifestOnDelete, isOpen, mediaLibraryService, projectId, workspaceSlug]);

  // handlers
  const handleClose = () => {
    onClose();
    setLoader(false);
    setRemoveFromManifest(true);
    setHasMediaLibraryArtifact(false);
    setIsMediaLibraryCheckLoading(false);
  };

  const handleDeletion = async (assetId: string) => {
    setLoader(true);
    const removeOptions = confirmManifestOnDelete
      ? { removeFromManifest: hasMediaLibraryArtifact ? removeFromManifest : false }
      : undefined;
    attachmentOperations
      .remove(assetId, removeOptions)
      .finally(() => handleClose());
  };

  if (!attachment) return <></>;
  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={() => handleDeletion(attachment.id)}
      isSubmitting={loader || (confirmManifestOnDelete && isMediaLibraryCheckLoading)}
      isOpen={isOpen}
      title={t("attachment.delete")}
      content={
        <>
          {/* TODO: Translate here */}
          Are you sure you want to delete attachment-{" "}
          <span className="font-bold">{getFileName(attachment.attributes.name)}</span>? This attachment will be
          permanently removed. This action cannot be undone.
          {confirmManifestOnDelete && hasMediaLibraryArtifact && (
            <label className="mt-3 flex items-start gap-2 text-sm text-custom-text-200">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={removeFromManifest}
                onChange={() => setRemoveFromManifest((prev) => !prev)}
              />
              <span>Also remove from media library</span>
            </label>
          )}
        </>
      }
    />
  );
});
