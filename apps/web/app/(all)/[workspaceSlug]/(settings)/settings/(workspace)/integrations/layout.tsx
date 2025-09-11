"use client";

import { useParams } from "next/navigation";
import { E_FEATURE_FLAGS } from "@plane/constants";
// components
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { ApplicationsUpgrade } from "@/plane-web/components/marketplace";

const IntegrationsLayout = ({ children }: { children: React.ReactNode }) => {
  const { workspaceSlug } = useParams();
  return (
    <SettingsContentWrapper size="md">
      <WithFeatureFlagHOC
        workspaceSlug={workspaceSlug?.toString()}
        flag={E_FEATURE_FLAGS.SILO_INTEGRATIONS}
        fallback={<ApplicationsUpgrade />}
      >
        {children}
      </WithFeatureFlagHOC>
    </SettingsContentWrapper>
  );
};

export default IntegrationsLayout;
