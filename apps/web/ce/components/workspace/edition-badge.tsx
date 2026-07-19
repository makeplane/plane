/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// ui
import { Tooltip } from "@plane/propel/tooltip";
import { getButtonStyling } from "@plane/propel/button";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
import packageJson from "package.json";

/**
 * The edition name, and the version on hover. It used to be a button that opened
 * the paid-plans modal; on this instance there is nothing to buy, so it is plain
 * text now. It stays a DOM element rather than disappearing because Tooltip puts
 * its ref on the child -- a component would trade the badge for a ref warning.
 */
export const WorkspaceEditionBadge = observer(function WorkspaceEditionBadge() {
  // platform
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip tooltipContent={`Version: v${packageJson.version}`} isMobile={isMobile}>
      <span className={getButtonStyling("tertiary", "lg")}>Community</span>
    </Tooltip>
  );
});
