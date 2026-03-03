/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
import { observer } from "mobx-react";
// components
import type { EPageStoreType } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";

export type TPageModalsProps = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageModals = observer(function PageModals(props: TPageModalsProps) {
  return null;
});
