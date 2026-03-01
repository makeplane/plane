/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// plane imports
import type { TPersonalAccountProvider, TUserConnection } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { GithubIcon, SlackIcon } from "@plane/propel/icons";
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
    <div className="flex flex-col border border-subtle-1 rounded-sm p-4 mb-2 justify-center">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-8 h-8" />}
        <div className="text-16 font-medium">{provider.name}</div>
      </div>
      <div className="text-13 text-gray-500 pt-2 pb-4">{provider.description}</div>

      {getConfigView()}

      {connectionSlug ? (
        <div className="rounded-sm p-2 flex justify-between items-center border-[1px] border-subtle-1">
          <p className="text-13 text-gray-400 font-medium">
            Your team uses <span className="underline">{connectionSlug}</span>.
          </p>
          <Button
            onClick={isUserConnected ? () => handleDisconnection(provider.key) : () => handleConnection(provider.key)}
            variant={isUserConnected ? "error-outline" : "primary"}
            className="w-20 h-6 ml-auto"
          >
            {isUserConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      ) : (
        <div className="rounded-sm p-2 flex justify-between ml-auto items-center">
          <Button
            onClick={isUserConnected ? () => handleDisconnection(provider.key) : () => handleConnection(provider.key)}
            variant={isUserConnected ? "error-outline" : "primary"}
            className="w-20 h-6 ml-auto"
          >
            {isUserConnected ? "Disconnect" : "Connect"}
          </Button>
        </div>
      )}
    </div>
  );
}
