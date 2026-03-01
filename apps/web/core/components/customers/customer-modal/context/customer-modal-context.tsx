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

import { createContext } from "react";
// plane imports
import type { TIssuePropertyValueErrors, TIssuePropertyValues } from "@plane/types";

export type TCreateUpdatePropertyValuesProps = {
  customerId: string;
  workspaceSlug: string;
};

export type TCustomerModalContext = {
  customerPropertyValues: TIssuePropertyValues;
  setCustomerPropertyValues: React.Dispatch<React.SetStateAction<TIssuePropertyValues>>;
  customerPropertyValueErrors: TIssuePropertyValueErrors;
  setCustomerPropertyValueErrors: React.Dispatch<React.SetStateAction<TIssuePropertyValueErrors>>;
  handlePropertyValuesValidation: () => boolean;
  handleCreateUpdatePropertyValues: (props: TCreateUpdatePropertyValuesProps) => Promise<void>;
};

export const CustomerModalContext = createContext<TCustomerModalContext | undefined>(undefined);
