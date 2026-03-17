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

import { observer } from "mobx-react";
import { E_FEATURE_FLAGS } from "@plane/constants";
import { CursorIntegrationRoot } from "@/components/integrations/cursor";
import { useFlag } from "@/plane-web/hooks/store";
import type { Route } from "./+types/page";

function CursorIntegration({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const isFeatureEnabled = useFlag(workspaceSlug, E_FEATURE_FLAGS.CURSOR_INTEGRATION) || false;

  if (!isFeatureEnabled) return null;

  return (
    <div className="space-y-6 relative w-full h-full overflow-auto flex flex-col">
      <CursorIntegrationRoot />
    </div>
  );
}

export default observer(CursorIntegration);
