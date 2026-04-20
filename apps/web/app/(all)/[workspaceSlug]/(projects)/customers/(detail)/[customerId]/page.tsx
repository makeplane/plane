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

import { CustomerDetailRoot } from "@/components/customers";
// types
import type { Route } from "./+types/page";

function CustomerDetailPage({ params }: Route.ComponentProps) {
  const { workspaceSlug, customerId } = params;
  return <CustomerDetailRoot workspaceSlug={workspaceSlug} customerId={customerId} />;
}

export default CustomerDetailPage;
