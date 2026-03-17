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

import { observer } from "mobx-react";
// components
import { PageWrapper } from "@/components/common/page-wrapper";
// plane admin imports
import { EnterpriseLicenseManagement } from "@/plane-admin/components/enterprise-license/root";
// types
import type { Route } from "./+types/page";

function BillingPage() {
  return (
    <PageWrapper
      header={{
        title: "Billings and plans",
        description: "Manage your instance license, view billing details, and upgrade your plan.",
      }}
    >
      <EnterpriseLicenseManagement />
    </PageWrapper>
  );
}

export const meta: Route.MetaFunction = () => [{ title: "Billing and Plans - God Mode" }];

export default observer(BillingPage);
