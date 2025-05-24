"use client";

import { useParams } from "next/navigation";
import { E_FEATURE_FLAGS } from "@plane/constants";
// components
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
import { ApplicationsUpgrade } from "@/plane-web/components/marketplace";

const ApplicationsLayout = ({ children }: { children: React.ReactNode }) => {
  const { workspaceSlug } = useParams();
  return (
    <WithFeatureFlagHOC
      workspaceSlug={workspaceSlug?.toString()}
      flag={E_FEATURE_FLAGS.APPLICATIONS}
      fallback={<ApplicationsUpgrade />}
    >
      {children}
    </WithFeatureFlagHOC>
  );
};

export default ApplicationsLayout;