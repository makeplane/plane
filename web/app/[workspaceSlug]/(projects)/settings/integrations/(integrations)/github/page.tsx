"use client";

import { FC, useState } from "react";
import Image from "next/image";
import { E_INTEGRATION_KEYS } from "@silo/core";
// silo hooks
import { useSyncConfig } from "@/plane-web/silo/hooks";
// silo components
import { UserAuthentication, IntegrationRoot } from "@/plane-web/silo/integrations/github/components";
// silo context
import { IntegrationContextProvider } from "@/plane-web/silo/integrations/github/contexts";
import GitHubLogo from "@/public/services/github.svg";

const GitHubIntegration: FC = () => {
  // states
  const [isOrganizationConnected, isPersonalAccountConnected] = useState<boolean>(false);

  return (
    <IntegrationContextProvider>
      <div className="relative space-y-10">
        {/* header */}
        <div className="flex-shrink-0 relative flex items-center gap-4 rounded bg-custom-background-90 p-4">
          <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
            <Image src={GitHubLogo} layout="fill" objectFit="contain" alt="GitHub Logo" />
          </div>
          <div>
            <div className="text-lg font-medium">GitHub</div>
            <div className="text-sm text-custom-text-200">
              Automate your pull request and commit workflows and keep issues synced both ways
            </div>
          </div>
        </div>

        {/* integration auth root */}
        <UserAuthentication />

        {/* integration root */}
        {/* <IntegrationRoot /> */}
      </div>
    </IntegrationContextProvider>
  );
};

export default GitHubIntegration;
