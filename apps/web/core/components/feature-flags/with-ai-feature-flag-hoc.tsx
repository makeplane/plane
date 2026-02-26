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

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import type { E_FEATURE_FLAGS } from "@plane/constants";
// plane web hooks
import { useAiFlag } from "@/plane-web/hooks/store/use-ai-flag";
import { useFlag } from "@/plane-web/hooks/store";

interface IWithAiFeatureFlagHOC {
  workspaceSlug: string;
  flag: keyof typeof E_FEATURE_FLAGS;
  disabledFallback?: ReactNode;
  notConfiguredFallback?: ReactNode;
  children: ReactNode;
}

export const WithAiFeatureFlagHOC = observer(function WithAiFeatureFlagHOC(props: IWithAiFeatureFlagHOC) {
  const { workspaceSlug, flag, disabledFallback, notConfiguredFallback, children } = props;
  // check if the feature flag is enabled
  const isFeatureEnabled = useFlag(workspaceSlug, flag);
  const isFeatureConfigured = useAiFlag(workspaceSlug, flag);
  // return the children if the feature flag is enabled else return the fallback

  if (!isFeatureEnabled) {
    return <>{disabledFallback}</>;
  }

  if (!isFeatureConfigured) {
    return <>{notConfiguredFallback}</>;
  }

  return <>{children}</>;
});
