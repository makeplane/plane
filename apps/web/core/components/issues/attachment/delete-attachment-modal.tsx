import type { FC } from "react";
import { useEffect, useState } from "react";
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
// types
import type { TAttachmentOperations } from "../issue-detail-widgets/attachments/helper";

export type TAttachmentOperationsRemoveModal = Pick<TAttachmentOperations, "remove">;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  attachmentId: string;
  attachmentOperations: TAttachmentOperationsRemoveModal;
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
    confirmManifestOnDelete = false,
    issueServiceType = EIssueServiceType.ISSUES,
  } = props;
  // states
  const [loader, setLoader] = useState(false);
  const [removeFromManifest, setRemoveFromManifest] = useState(true);

  // store hooks
  const {
    attachment: { getAttachmentById },
  } = useIssueDetail(issueServiceType);

  // derived values
  const attachment = attachmentId ? getAttachmentById(attachmentId) : undefined;

  useEffect(() => {
    if (isOpen) setRemoveFromManifest(true);
  }, [isOpen]);

  // handlers
  const handleClose = () => {
    onClose();
    setLoader(false);
    setRemoveFromManifest(true);
  };

  const handleDeletion = async (assetId: string) => {
    setLoader(true);
    attachmentOperations
      .remove(assetId, confirmManifestOnDelete ? { removeFromManifest } : undefined)
      .finally(() => handleClose());
  };

  if (!attachment) return <></>;
  return (
    <AlertModalCore
      handleClose={handleClose}
      handleSubmit={() => handleDeletion(attachment.id)}
      isSubmitting={loader}
      isOpen={isOpen}
      title={t("attachment.delete")}
      content={
        <>
          {/* TODO: Translate here */}
          Are you sure you want to delete attachment-{" "}
          <span className="font-bold">{getFileName(attachment.attributes.name)}</span>? This attachment will be
          permanently removed. This action cannot be undone.
          {confirmManifestOnDelete && (
            <label className="mt-3 flex items-start gap-2 text-sm text-custom-text-200">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={removeFromManifest}
                onChange={() => setRemoveFromManifest((prev) => !prev)}
              />
              <span>Also remove from media library (manifest.json)</span>
            </label>
          )}
        </>
      }
    />
  );
});
