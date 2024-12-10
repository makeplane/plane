"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft } from "lucide-react";
// plane web components
import { Loader } from "@plane/ui";
import { SlackIntegrationRoot } from "@/plane-web/components/integrations/slack";
//  plane web hooks
import { useFlag } from "@/plane-web/hooks/store";
// plane web constants
import { useSlackIntegration } from "@/plane-web/hooks/store/integrations/use-slack";
import { E_FEATURE_FLAGS } from "@/plane-web/types/feature-flag";

const SlackIntegration: FC = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { fetchExternalApiToken, externalApiToken } = useSlackIntegration();
  // derived values
  const isFeatureEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.SLACK_INTEGRATION);

  // fetching external api token
  const { isLoading: externalApiTokenIsLoading } = useSWR(
    workspaceSlug && !externalApiToken ? `IMPORTER_EXTERNAL_SERVICE_TOKEN` : null,
    workspaceSlug && !externalApiToken ? async () => fetchExternalApiToken(workspaceSlug?.toString()) : null,
    { errorRetryCount: 0 }
  );

  if (!isFeatureEnabled)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        Slack integration is not enabled for this workspace.
      </div>
    );

  return (
    <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
      <div className="flex-shrink-0 text-sm text-custom-text-300 hover:text-custom-text-200 hover:underline font-medium">
        <Link className="flex items-center gap-2" href={`/${workspaceSlug?.toString()}/settings/integrations`}>
          <ArrowLeft size={16} />
          Back to integrations
        </Link>
      </div>
      {externalApiTokenIsLoading ? (
        <Loader className="w-full h-full flex flex-col gap-8">
          <Loader.Item width="100%" height="60px" />
          <Loader.Item width="100%" height="40px" />
          <Loader.Item width="200px" height="30px" />
          <Loader.Item width="100%" height="45px" />
          <Loader.Item width="100%" height="45px" />
        </Loader>
      ) : (
        <SlackIntegrationRoot />
      )}
    </div>
  );
});

export default SlackIntegration;
