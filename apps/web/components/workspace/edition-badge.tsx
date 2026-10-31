/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// ui
import { Tooltip } from "@makeplane/propel/components/tooltip";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import packageJson from "package.json";
// local components

export const WorkspaceEditionBadge = observer(function WorkspaceEditionBadge() {
  // platform
  const { isMobile } = usePlatformOS();

  // There are no plans: this fork has every feature, so the badge only shows the version.
  return (
    <Tooltip label={`Version: v${packageJson.version}`} disabled={isMobile}>
      <span className="px-2 py-1 text-caption-sm-regular text-tertiary">v{packageJson.version}</span>
    </Tooltip>
  );
});
