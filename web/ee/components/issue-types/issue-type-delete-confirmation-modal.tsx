import { useState, FC } from "react";
import { observer } from "mobx-react";
import { AlertTriangle } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";
import { useIssueTypes } from "@/plane-web/hooks/store";

type TProps = {
  issueTypeId: string | null;
  isModalOpen: boolean;
  handleModalClose: () => void;
  handleEnableDisable: (issueTypeId: string) => Promise<void>;
};

export const IssueTypeDeleteConfirmationModal: FC<TProps> = observer((props) => {
  const { issueTypeId, isModalOpen, handleModalClose, handleEnableDisable } = props;
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  // plane hooks
  const { t } = useTranslation();
  const { deleteType, getIssueTypeById } = useIssueTypes();
  const issueTypeDetail = issueTypeId ? getIssueTypeById(issueTypeId) : null;
  const isDefault = issueTypeDetail?.is_default;
  const isTypeDisabled = !issueTypeDetail?.is_active;

  const handleDelete = async () => {
    if (!issueTypeId) return;
    setIsDeleting(true);
    await deleteType(issueTypeId).finally(() => {
      handleModalClose();
      setIsDeleting(false);
    });
  };

  return (
    <ModalCore
      isOpen={isModalOpen}
      handleClose={handleModalClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.XXL}
      className="py-5 px-6"
    >
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <span className={cn("flex-shrink-0 grid place-items-center rounded-full size-10 bg-red-500/10 text-red-500")}>
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <div className="py-1 text-center sm:text-left">
          <h3 className="text-lg font-medium">{t("work_item_types.settings.item_delete_confirmation.title")}</h3>
          <div className="py-1 pb-4 text-center sm:text-left text-sm text-custom-text-200">
            <p>{t("work_item_types.settings.item_delete_confirmation.description")}</p>
            {!isDefault && !isTypeDisabled && (
              <p className="text-xs text-custom-text-200">
                {t("work_item_types.settings.item_delete_confirmation.can_disable_warning")}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="px-1 pt-4 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 border-t-[0.5px] border-custom-border-200">
        <Button variant="neutral-primary" size="sm" onClick={handleModalClose} disabled={isDeleting}>
          {t("common.cancel")}
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 items-center sm:justify-end">
          {!isDefault && !isTypeDisabled && (
            <Button
              variant="neutral-primary"
              size="sm"
              onClick={async () => {
                if (!issueTypeId) return;
                await handleEnableDisable(issueTypeId);
                handleModalClose();
              }}
              disabled={isDeleting}
            >
              {t("work_item_types.settings.properties.delete_confirmation.secondary_button")}
            </Button>
          )}
          <Button
            variant="danger"
            size="sm"
            tabIndex={1}
            onClick={handleDelete}
            className="w-full focus:!text-white"
            disabled={isDeleting}
          >
            {t("work_item_types.settings.properties.delete_confirmation.primary_button", {
              action: isDefault || isTypeDisabled ? t("common.yes") : t("common.no"),
            })}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
