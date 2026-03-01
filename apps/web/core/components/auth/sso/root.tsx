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

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate, useSearchParams } from "react-router";
// plane imports
import { SSO_ERROR_MESSAGES, isSSOErrorCode } from "@plane/constants";
// components
import { TermsAndConditions } from "@/components/account/terms-and-conditions";
import { AuthBanner } from "@/components/account/auth-forms/auth-banner";
import { AuthHeaderBase } from "@/components/account/auth-forms/auth-header";
// helpers
import { EAuthModes } from "@/helpers/authentication.helper";
// local imports
import { SSOForm } from "./form";

export const SSORoot = observer(function SSORoot() {
  // router
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // query params
  const nextPath = searchParams.get("next_path");
  const errorCode = searchParams.get("error_code");
  const email = searchParams.get("email");
  // states
  const [errorInfo, setErrorInfo] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (errorCode && isSSOErrorCode(errorCode)) {
      const errorInfo = SSO_ERROR_MESSAGES[errorCode];
      setErrorInfo(errorInfo);
    }
  }, [errorCode]);

  return (
    <div className="flex flex-col justify-center items-center flex-grow w-full py-6 mt-10">
      <div className="relative flex flex-col gap-6 max-w-[22.5rem] w-full">
        {errorInfo && <AuthBanner message={errorInfo} handleBannerData={(value) => setErrorInfo(value)} />}
        <AuthHeaderBase header="Continue with SSO." subHeader="Enter your SSO credentials." />
        <SSOForm nextPath={nextPath} onBack={() => void navigate("/")} emailParam={email} />
        <TermsAndConditions authType={EAuthModes.SIGN_IN} />
      </div>
    </div>
  );
});
