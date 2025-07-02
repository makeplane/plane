// plane imports
import { TPersonalAccountProvider, TUserConnection } from "@plane/constants";
import { Button, GithubIcon, Loader, SlackIcon } from "@plane/ui";

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

  if (isConnectionLoading) {
    return (
      <div className="flex flex-col border border-custom-border-200 rounded-s p-4 mb-2 justify-center">
        {/* Icon and Title Section */}
        <div className="flex items-center gap-1">
          <Loader>
            <Loader.Item height="32px" width="32px" />
          </Loader>
          <Loader>
            <Loader.Item height="24px" width="80px" />
          </Loader>
        </div>

        {/* Description Section */}
        <div className="pt-2 pb-4">
          <Loader>
            <Loader.Item height="16px" width="100%" />
          </Loader>
        </div>

        {/* Connection Status Section */}
        <div className="rounded-s bg-neutral-100 p-2 flex justify-between items-center border-[1px] border-custom-border-300">
          <div className="flex-1">
            <Loader>
              <Loader.Item height="16px" width="80%" />
            </Loader>
          </div>
          <Loader>
            <Loader.Item height="24px" width="64px" />
          </Loader>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-custom-border-200 rounded-s p-4 mb-2 justify-center">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-8 h-8" />}
        <div className="text-lg font-medium">{provider.name}</div>
      </div>
      <div className="text-sm text-gray-500 pt-2 pb-4">{provider.description}</div>

      {connectionSlug ? (
        <div className="rounded-s bg-custom-background-400 p-2 flex justify-between items-center border-[1px] border-custom-border-300">
          <p className="text-sm text-gray-400 font-medium">
            Your team uses <span className="underline">{connectionSlug}</span>.
          </p>
          <Button
            size="sm"
            onClick={isUserConnected ? () => handleDisconnection(provider.key) : () => handleConnection(provider.key)}
            variant={isUserConnected ? "outline-danger" : "primary"}
            className="w-20 h-6 ml-auto"
          >
            {isUserConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      ) : (
        <div className="rounded-s p-2 flex justify-between ml-auto items-center">
          <Button
            size="sm"
            onClick={isUserConnected ? () => handleDisconnection(provider.key) : () => handleConnection(provider.key)}
            variant={isUserConnected ? "outline-danger" : "primary"}
            className="w-20 h-6 ml-auto"
          >
            {isUserConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      )}
    </div>
  );
}
