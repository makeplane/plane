/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * Modified by Okręgowa Spółdzielnia Mleczarska w Piątnicy in 2026.
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// ui
import { Button } from "@plane/propel/button";
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
      <Button
        variant="tertiary"
        size="lg"
        onClick={() => window.open(PI_PLANE_REPO_URL, "_blank", "noopener,noreferrer")}
      >
        Pi-Plane
      </Button>
    </Tooltip>
  );
});
