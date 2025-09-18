// plane imports
import { TPersonalAccountProvider, TUserConnection, USER_CONNECTIONS_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { GithubIcon, SlackIcon } from "@plane/propel/icons";
import { Button } from "@plane/ui";
import { CONFIG_VIEWS } from "./config-views";
import { ConnectionLoader } from "./loader";

export type TPersonalAccountConnectProps = {
  provider: TPersonalAccountProvider;
  isConnectionLoading: boolean;
  isUserConnected: boolean;
  connectionSlug?: string;
  handleConnection: (source: TUserConnection) => Promise<void>;
  handleDisconnection: (source: TUserConnection) => Promise<void>;
};

export const IntegrationIcon = {
  GITHUB: GithubIcon,
  SLACK: SlackIcon,
  GITHUB_ENTERPRISE: GithubIcon,
};

export function PersonalAccountConnectView(props: TPersonalAccountConnectProps) {
  const { provider, connectionSlug, isConnectionLoading, isUserConnected, handleConnection, handleDisconnection } =
    props;

  if (!provider) return null;

  const Icon = IntegrationIcon[provider.key];

  if (isConnectionLoading) return <ConnectionLoader />;

  const getConfigView = () => {
    if (CONFIG_VIEWS[provider.key]) {
      const View = CONFIG_VIEWS[provider.key];
      if (View) {
        return <View {...props} />;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col border border-custom-border-200 rounded p-4 mb-2 justify-center">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-8 h-8" />}
        <div className="text-lg font-medium">{provider.name}</div>
      </div>
      <div className="text-sm text-gray-500 pt-2 pb-4">{provider.description}</div>

      {getConfigView()}

      {connectionSlug ? (
        <div className="rounded p-2 flex justify-between items-center border-[1px] border-custom-border-300">
          <p className="text-sm text-gray-400 font-medium">
            Your team uses <span className="underline">{connectionSlug}</span>.
          </p>
          <Button
            size="sm"
            onClick={isUserConnected ? () => handleDisconnection(provider.key) : () => handleConnection(provider.key)}
            variant={isUserConnected ? "outline-danger" : "primary"}
            className="w-20 h-6 ml-auto"
            data-ph-element={USER_CONNECTIONS_VIEW_TRACKER_ELEMENTS.CONNECTION_CONNECT_DISCONNECT_BUTTON}
          >
            {isUserConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      ) : (
        <div className="rounded p-2 flex justify-between ml-auto items-center">
          <Button
            size="sm"
            onClick={isUserConnected ? () => handleDisconnection(provider.key) : () => handleConnection(provider.key)}
            variant={isUserConnected ? "outline-danger" : "primary"}
            className="w-20 h-6 ml-auto"
            data-ph-element={USER_CONNECTIONS_VIEW_TRACKER_ELEMENTS.CONNECTION_CONNECT_DISCONNECT_BUTTON}
          >
            {isUserConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      )}
    </div>
  );
}
