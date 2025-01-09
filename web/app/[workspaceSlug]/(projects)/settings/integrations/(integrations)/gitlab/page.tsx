"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import useSWR from "swr";
// plane web components components
import { E_FEATURE_FLAGS } from "@plane/constants";
import { UserAuthentication, IntegrationRoot } from "@/plane-web/components/integrations/gitlab";
// plane web hooks
import { useFlag, useGitlabIntegration } from "@/plane-web/hooks/store";
// public images
import GitlabLogo from "@/public/services/gitlab.svg";

const GitlabIntegration: FC = observer(() => {
  // hooks
  const {
    workspace,
    externalApiToken,
    fetchExternalApiToken,
    auth: { workspaceConnectionIds, workspaceConnectionById },
  } = useGitlabIntegration();

  // derived values
  const workspaceSlug = workspace?.slug || undefined;
  const isFeatureEnabled = useFlag(workspaceSlug?.toString() || "", E_FEATURE_FLAGS.GITLAB_INTEGRATION) || true;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const organization = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    isFeatureEnabled && workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN_${workspaceSlug}` : null,
    isFeatureEnabled && workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug) : null,
    { errorRetryCount: 0 }
  );

  if (!isFeatureEnabled) return null;

  if (!externalApiToken && externalApiTokenIsLoading)
    return <div className="text-custom-text-200 relative flex justify-center items-center">Loading...</div>;

  if (!externalApiToken)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        Not able to access the external api token. Please try again later.
      </div>
    );

  return (
    <div className="relative space-y-10">
      {/* header */}
      <div className="flex-shrink-0 relative flex items-center gap-4 rounded bg-custom-background-90/50 p-4">
        <div className="flex-shrink-0 w-10 h-10 relative flex justify-center items-center overflow-hidden">
          <Image src={GitlabLogo} layout="fill" objectFit="contain" alt="Gitlab Logo" />
        </div>
        <div>
          <div className="text-lg font-medium">Gitlab</div>
          <div className="text-sm text-custom-text-200">
            Automate your pull request and commit workflows and keep issues synced both ways
          </div>
        </div>
      </div>

      {/* integration auth root */}
      <UserAuthentication />

      {/* integration root */}
      {organization && <IntegrationRoot />}
    </div>
  );
});

export default GitlabIntegration;
