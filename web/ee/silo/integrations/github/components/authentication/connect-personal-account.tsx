"use client";

import { FC } from "react";
import { Button } from "@plane/ui";

export const ConnectPersonalAccount: FC = (props) => {
  const {} = props;

  // hooks
  // const { data, isLoading } = useSyncConfig(E_INTEGRATION_KEYS.GITHUB_USER);

  // if (isLoading)
  //   return <div className="text-custom-text-200 relative flex justify-center items-center">github-auth Loading...</div>;

  // if (!data)
  //   return (
  //     <div className="text-custom-text-200 relative flex justify-center items-center">
  //       github-auth Something went wrong
  //     </div>
  //   );

  return (
    <div className="relative space-y-2">
      <div className="text-sm font-medium text-custom-text-200">Account Connection</div>
      <div className="relative flex justify-between items-center gap-4 p-4 border border-custom-border-100 rounded">
        <div>
          <div className="text-base font-medium">Connect personal account</div>
          <div className="text-sm text-custom-text-200">Connect your GitHub account to use the integration</div>
        </div>
        <Button variant="neutral-primary" size="sm" className="flex-shrink-0">
          Connect
        </Button>
      </div>
    </div>
  );
};
