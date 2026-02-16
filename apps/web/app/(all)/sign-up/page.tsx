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

import { GOOGLE_ANALYTICS_ID } from "@plane/constants";

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
      {GOOGLE_ANALYTICS_ID && (
        <>
          <script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`} id="google-analytics" />
          <script
            async
            src="https://tag.clearbitscripts.com/v1/pk_12bcecff2ad52af4201b104045511543/tags.js"
            referrerPolicy="strict-origin-when-cross-origin"
          />
          <script
            id="google-analytics-config"
            dangerouslySetInnerHTML={{
              __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_ANALYTICS_ID}');
          `,
            }}
          />
        </>
      )}
      <AuthBase authType={EAuthModes.SIGN_UP} />
    </DefaultLayout>
  );
}

export default SignUpPage;
