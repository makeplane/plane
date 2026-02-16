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

// components
import { AuthFooter } from "@/components/auth-screens/footer";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// components
import { AuthHeaderBase } from "@/components/auth-screens/header";
// plane web imports
import { SSORoot } from "@/components/auth/sso/root";

function SSOAuthPage() {
  return (
    <DefaultLayout>
      <div className="relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
        <AuthHeaderBase pageTitle={"SSO Authentication - Plane"} />
        <SSORoot />
        <AuthFooter />
      </div>
    </DefaultLayout>
  );
}

export default SSOAuthPage;
