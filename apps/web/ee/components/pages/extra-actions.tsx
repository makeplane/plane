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
import { observer } from "mobx-react";
// plane imports
import type { TPageHeaderExtraActionsProps } from "@/ce/components/pages/extra-actions";
import { PagePublishActions } from "./publish-actions";

export const PageDetailsHeaderExtraActions = observer(function PageDetailsHeaderExtraActions(
  props: TPageHeaderExtraActionsProps
) {
  const { page } = props;

  if (!page.canCurrentUserEditPage) return null;
  return <PagePublishActions page={page} />;
});
