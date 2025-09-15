// plane imports
import { useState } from "react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { Checkbox, setToast, TOAST_TYPE } from "@plane/ui";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useSlackIntegration } from "@/plane-web/hooks/store";
import { TPersonalAccountConnectProps } from "../personal-account-view";

export function SlackConfigView(props: TPersonalAccountConnectProps) {
  const { provider, isConnectionLoading, isUserConnected } = props;

  const [isUpdating, setIsUpdating] = useState(false);
  const { fetchUserAlertsConfig, setUserAlertsConfig } = useSlackIntegration();
  const { currentWorkspace } = useWorkspace();

  const {
    data: userAlertsConfig,
    isLoading: isUserAlertsConfigLoading,
    mutate: mutateUserAlertsConfig,
  } = useSWR(`SLACK_USER_ALERTS_CONFIG_${currentWorkspace?.slug}`, fetchUserAlertsConfig);
  const { t } = useTranslation();

  if (!provider) return null;
  if (isConnectionLoading || !isUserConnected || isUserAlertsConfigLoading) return null;

  const handleToggle = async () => {
    try {
      setIsUpdating(true);
      await setUserAlertsConfig({ isEnabled: !userAlertsConfig?.isEnabled });
      mutateUserAlertsConfig();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error",
        message: "Failed to update Slack user alerts config",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-1 py-2">
      <Checkbox
        checked={userAlertsConfig?.isEnabled}
        onChange={handleToggle}
        iconClassName="size-3"
        className="h-4 w-4"
        disabled={isUpdating}
      />
      <span className="text-sm text-custom-text-200">{t("slack_integration.alerts.dm_alerts.title")}</span>
    </div>
  );
}
