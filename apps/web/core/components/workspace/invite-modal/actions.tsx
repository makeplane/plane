import { observer } from "mobx-react";

// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { PlusIcon } from "@plane/propel/icons";
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

export const InvitationModalActions = observer(function InvitationModalActions(props: TInvitationModalActionsProps) {
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
          "flex items-center gap-1 bg-transparent py-2 pr-3 text-caption-md-medium text-accent-primary outline-accent-strong",
          {
            "cursor-not-allowed opacity-60": isInviteDisabled,
          }
        )}
        onClick={appendField}
        disabled={isInviteDisabled}
      >
        <PlusIcon className="h-3.5 w-3.5" />
        {addMoreButtonText || t("common.add_more")}
      </button>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="lg" onClick={handleClose}>
          {cancelButtonText || t("cancel")}
        </Button>
        <Button variant="primary" size="lg" type="submit" loading={isSubmitting} disabled={isInviteDisabled}>
          {isSubmitting
            ? submitButtonText?.loading || t("workspace_settings.settings.members.modal.button_loading")
            : submitButtonText?.default || t("workspace_settings.settings.members.modal.button")}
        </Button>
      </div>
    </div>
  );
});
