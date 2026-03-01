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

import React from "react";
import type { TBaseLayoutType } from "@plane/types";
import { GenericLayoutLoader } from "@/components/base-layouts/loaders/layout-loader";
import { DEFAULT_INITIATIVE_LAYOUT } from "@/constants/initiative";

function InitiativeLayoutLoader({ layout }: { layout?: TBaseLayoutType }) {
  return <GenericLayoutLoader layout={layout ?? DEFAULT_INITIATIVE_LAYOUT} />;
}

export default InitiativeLayoutLoader;
