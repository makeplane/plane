/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// ui
import { getButtonStyling } from "@plane/propel/button";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import packageJson from "package.json";

const PI_PLANE_REPO_URL = "https://github.com/OSM-Piatnica/pi-plane";

export const WorkspaceEditionBadge = observer(function WorkspaceEditionBadge() {
  // platform
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
      <a
        href={PI_PLANE_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={getButtonStyling("tertiary", "lg")}
      >
        Pi-Plane
      </a>
    </Tooltip>
  );
});
