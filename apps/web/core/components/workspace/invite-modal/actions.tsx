import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
import { cn } from "@plane/utils";

type TInvitationModalActionsProps = {
  isInviteDisabled?: boolean;
  isSubmitting?: boolean;
  handleClose: () => void;
  appendField: () => void;
  addMoreButtonText?: string;
  submitButtonText?: {
    default: string;
    loading: string;
  };
  cancelButtonText?: string;
  className?: string;
};

export const InvitationModalActions: React.FC<TInvitationModalActionsProps> = observer((props) => {
  const {
    isInviteDisabled = false,
    isSubmitting = false,
    handleClose,
    appendField,
    addMoreButtonText,
    submitButtonText,
    cancelButtonText,
    className,
  } = props;
  // store hooks
  const { t } = useTranslation();

  return (
    <div className={cn("mt-5 flex items-center justify-between gap-2", className)}>
      <button
        type="button"
        className={cn(
          "flex items-center gap-1 bg-transparent py-2 pr-3 text-xs font-medium text-custom-primary outline-custom-primary",
          {
            "cursor-not-allowed opacity-60": isInviteDisabled,
          }
        )}
        onClick={appendField}
        disabled={isInviteDisabled}
      >
        <Plus className="h-3.5 w-3.5" />
        {addMoreButtonText || t("common.add_more")}
      </button>
      <div className="flex items-center gap-2">
        <Button variant="neutral-primary" size="sm" onClick={handleClose}>
          {cancelButtonText || t("cancel")}
        </Button>
        <Button variant="primary" size="sm" type="submit" loading={isSubmitting} disabled={isInviteDisabled}>
          {isSubmitting
            ? submitButtonText?.loading || t("workspace_settings.settings.members.modal.button_loading")
            : submitButtonText?.default || t("workspace_settings.settings.members.modal.button")}
        </Button>
      </div>
    </div>
  );
});
