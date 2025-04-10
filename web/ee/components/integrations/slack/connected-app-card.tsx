import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Unplug } from "lucide-react";
import { TSlackConfig, TSlackConnectionData } from "@plane/etl/slack";
import { useTranslation } from "@plane/i18n";
import { TWorkspaceConnection } from "@plane/types";
import { Button, CustomMenu } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";

type TConnectedAppCardProps = {
  data: TWorkspaceConnection<TSlackConfig, TSlackConnectionData>;
  handleDisconnect: (connectionId: string) => Promise<void>;
};

export const ConnectedAppCard = observer((props: TConnectedAppCardProps) => {
  const { data, handleDisconnect } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleDisconnectApp = async () => {
    setIsLoading(true);
    await handleDisconnect(data.connection_id);
    setIsLoading(false);
  };

  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 p-4 border border-custom-border-100 rounded-lg">
      <div className="w-full h-full overflow-hidden">
        <div className="text-sm font-medium">{data.connection_data.name}</div>
        <div className="text-sm text-custom-text-200">
          {" "}
          {t("slack_integration.connected_on", { date: renderFormattedDate(data.created_at) })}
        </div>
      </div>
      <div className="flex-shrink-0 relative flex items-center">
        <CustomMenu
          placement="bottom"
          closeOnSelect
          customButton={
            <Button size="sm" variant="link-neutral" loading={isLoading}>
              {isLoading ? t("common.disconnecting") : t("common.connected")}
              <ChevronDown size={12} />
            </Button>
          }
        >
          <CustomMenu.MenuItem
            key={t("common.disconnect")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDisconnectApp();
            }}
            className={cn("flex items-center gap-2")}
          >
            <Unplug className="size-3" />
            {t("slack_integration.disconnect_workspace", { name: data.connection_data.name })}
          </CustomMenu.MenuItem>
        </CustomMenu>
      </div>
    </div>
  );
});
