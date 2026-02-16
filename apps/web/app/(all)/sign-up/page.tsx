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
import { AuthBase } from "@/components/auth-screens/auth-base";
// helpers
import { EAuthModes } from "@/helpers/authentication.helper";
import { redirectIfUserIsAuthenticated } from "@/lib/middleware/auth-client-middleware";
// assets
import DefaultLayout from "@/layouts/default-layout";

export const clientMiddleware = [redirectIfUserIsAuthenticated];

function SignUpPage() {
  return (
    <DefaultLayout>
      <AuthBase authType={EAuthModes.SIGN_UP} />
    </DefaultLayout>
  );
}

export default SignUpPage;
