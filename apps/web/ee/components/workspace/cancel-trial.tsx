import { useState } from "react";
import { useParams } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TProps = { setActiveSubscriptionModal: (value: boolean) => void };

export const CancelTrial = (props: TProps) => {
  const { setActiveSubscriptionModal } = props;
  // router
  const { workspaceSlug } = useParams();
  // state
  const [isSubmitting, setIsSubmitting] = useState(false);
  //hooks
  const { cancelFreeTrial } = useWorkspaceSubscription();
  const { t } = useTranslation();

  const handleTrialCancellation = async () => {
    setIsSubmitting(true);
    await cancelFreeTrial(workspaceSlug.toString())
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("workspace_settings.settings.cancel_trial.cancel_success_title"),
          message: t("workspace_settings.settings.cancel_trial.cancel_success_message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.cancel_trial.cancel_error_title"),
          message: t("workspace_settings.settings.cancel_trial.cancel_error_message"),
        });
      });
    setIsSubmitting(false);
  };

  return (
    <div>
      <div className="p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <span
          className={cn(
            "flex-shrink-0 grid place-items-center rounded-full size-12 sm:size-10 bg-custom-primary-100/20 text-custom-primary-100"
          )}
        >
          <CircleAlert className="size-5" aria-hidden="true" />
        </span>
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-medium">{t("workspace_settings.settings.cancel_trial.title")}</h3>
          <p className="mt-1 text-sm text-custom-text-200">
            {t("workspace_settings.settings.cancel_trial.description")}
          </p>
        </div>
      </div>
      <div className="px-5 pb-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="neutral-primary" size="sm" onClick={() => setActiveSubscriptionModal(false)}>
          {t("workspace_settings.settings.cancel_trial.dismiss")}
        </Button>
        <Button variant="danger" size="sm" type="submit" loading={isSubmitting} onClick={handleTrialCancellation}>
          {isSubmitting ? t("common.cancelling") : t("workspace_settings.settings.cancel_trial.cancel")}
        </Button>
      </div>
    </div>
  );
};
