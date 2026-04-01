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

import type { TSupportedFlagsForUpgrade } from "@plane/constants";

import { WithFeatureFlagHOC } from "@/components/feature-flags/with-feature-flag-hoc";
import { UpgradeEmptyStateButton } from "@/components/workspace/upgrade-empty-state-button";

type TFeatureFlagWrapperProps = {
  workspaceSlug: string;
  featureFlag?: TSupportedFlagsForUpgrade;
  children: React.ReactNode;
  showUpgradeButton?: boolean;
};

export function FeatureFlagWrapper(props: TFeatureFlagWrapperProps): React.ReactNode {
  const { workspaceSlug, featureFlag, children, showUpgradeButton = false } = props;

  if (!featureFlag) {
    return children;
  }

  return (
    <WithFeatureFlagHOC
      flag={featureFlag}
      fallback={
        showUpgradeButton ? <UpgradeEmptyStateButton workspaceSlug={workspaceSlug} flag={featureFlag} /> : <></>
      }
      workspaceSlug={workspaceSlug}
    >
      {children}
    </WithFeatureFlagHOC>
  );
}
