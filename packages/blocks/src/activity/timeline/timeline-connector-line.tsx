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

import { TIMELINE_CONNECTOR_LEFT } from "./constants";

/**
 * Absolute-positioned vertical connector line that spans the full height
 * of its relative parent, aligned to the center of TimelineItemIcon.
 */
export function TimelineConnectorLine() {
  return <div className={`absolute ${TIMELINE_CONNECTOR_LEFT} top-0 bottom-0 w-px bg-layer-3`} aria-hidden />;
}
