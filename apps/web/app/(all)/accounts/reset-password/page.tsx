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

// plane imports
import { EAuthModes } from "@plane/constants";
// components
import { ResetPasswordForm } from "@/components/account/auth-forms/reset-password";
import { AuthHeader } from "@/components/auth-screens/header";
// helpers
import { redirectIfUserIsAuthenticated } from "@/lib/middleware/auth-client-middleware";
// layouts
import DefaultLayout from "@/layouts/default-layout";

export const clientMiddleware = [redirectIfUserIsAuthenticated];

function ResetPasswordPage() {
  return (
    <DefaultLayout>
      <div className="relative z-10 flex flex-col items-center w-screen h-screen overflow-hidden overflow-y-auto pt-6 pb-10 px-8">
        <AuthHeader type={EAuthModes.SIGN_IN} />
        <ResetPasswordForm />
      </div>
    </DefaultLayout>
  );
}

export default ResetPasswordPage;
