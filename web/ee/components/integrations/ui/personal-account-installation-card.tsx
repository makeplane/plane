import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, Unplug, ChevronRight } from "lucide-react";
// ui
import { Button, CustomMenu, Loader } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";

type TPersonalAccountInstallationCardProps = {
  providerName: string;
  isConnectionLoading: boolean;
  isUserConnected: boolean;
  handleConnection: () => Promise<void>;
};

export const PersonalAccountInstallationCard = observer((props: TPersonalAccountInstallationCardProps) => {
  const { providerName, isConnectionLoading, isUserConnected, handleConnection } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);

  const handleConnectDisconnect = async () => {
    setIsLoading(true);
    await handleConnection();
    setIsLoading(false);
  };

  return (
    <div className="flex-shrink-0 relative flex items-center gap-4 p-2">
      <div className="w-full h-full overflow-hidden">
        <div className="text-sm font-medium">Connect your personal account</div>
        <div className="text-sm text-custom-text-200">
          {isUserConnected
            ? `Your personal ${providerName} account is now connected to Plane.`
            : `Link your personal ${providerName} account to Plane.`}
        </div>
      </div>
      <div className="flex-shrink-0 relative flex items-center">
        {isUserConnected ? (
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
                handleConnectDisconnect();
              }}
              className={cn("flex items-center gap-2")}
            >
              <Unplug className="size-3" />
              Disconnect personal {providerName} account
            </CustomMenu.MenuItem>
          </CustomMenu>
        ) : isConnectionLoading ? (
          <Loader className="flex items-center justify-center">
            <Loader.Item width="100px" height="28px" />
          </Loader>
        ) : (
          <Button size="sm" variant="link-neutral" onClick={handleConnectDisconnect} loading={isLoading}>
            {isLoading ? "Connecting" : "Connect"}
            <ChevronRight size={12} />
          </Button>
        )}
      </div>
    </div>
  );
});
