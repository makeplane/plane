import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Unplug } from "lucide-react";
import { Button, CustomMenu } from "@plane/ui";
import { TAppConnection } from "@silo/slack";
// helpers
import { cn } from "@/helpers/common.helper";
import { renderFormattedDate } from "@/helpers/date-time.helper";

type TConnectedAppCardProps = {
  data: TAppConnection;
  handleDisconnect: (connectionId: string) => Promise<void>;
};

export const ConnectedAppCard = observer((props: TConnectedAppCardProps) => {
  const { data, handleDisconnect } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);

  const handleDisconnectApp = async () => {
    setIsLoading(true);
    await handleDisconnect(data.connectionId);
    setIsLoading(false);
  };

  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 p-4 border border-custom-border-100 rounded-lg">
      <div className="w-full h-full overflow-hidden">
        <div className="text-sm font-medium">{data.connectionData.name}</div>
        <div className="text-sm text-custom-text-200">Connected on {renderFormattedDate(data.createdAt)}</div>
      </div>
      <div className="flex-shrink-0 relative flex items-center">
        <CustomMenu
          placement="bottom"
          closeOnSelect
          customButton={
            <Button size="sm" variant="link-neutral" loading={isLoading}>
              {isLoading ? "Disconnecting" : "Connected"}
              <ChevronDown size={12} />
            </Button>
          }
        >
          <CustomMenu.MenuItem
            key="disconnect"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDisconnectApp();
            }}
            className={cn("flex items-center gap-2")}
          >
            <Unplug className="size-3" />
            Disconnect {data.connectionData.name} workspace
          </CustomMenu.MenuItem>
        </CustomMenu>
      </div>
    </div>
  );
});
