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
import { useTranslation } from "@plane/i18n";
// components
import { TermsAndConditions } from "@/components/account/terms-and-conditions";
import { AuthBanner } from "@/components/account/auth-forms/auth-banner";
import { AuthHeaderBase } from "@/components/account/auth-forms/auth-header";
// helpers
import { EAuthModes } from "@/helpers/authentication.helper";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
// local imports
import { LDAPForm } from "./form";
import { isLDAPErrorCode, LDAP_ERROR_CODE_MESSAGES } from "./message";
import type { TLDAPErrorInfo } from "./message";

export const LDAPRoot = observer(function LDAPRoot() {
  // router
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // query params
  const nextPath = searchParams.get("next_path");
  const errorCode = Number(searchParams.get("error_code"));
  // states
  const [errorInfo, setErrorInfo] = useState<TLDAPErrorInfo | undefined>(undefined);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { config } = useInstance();
  // derived values
  const ldapProviderName = config?.ldap_provider_name?.trim() || "LDAP";

  useEffect(() => {
    if (errorCode && isLDAPErrorCode(errorCode)) {
      const errorInfo = LDAP_ERROR_CODE_MESSAGES[errorCode];
      setErrorInfo(errorInfo);
    }
  }, [errorCode]);

  return (
    <div className="flex flex-col justify-center items-center flex-grow w-full py-6 mt-10">
      <div className="relative flex flex-col gap-6 max-w-[22.5rem] w-full">
        {errorInfo && <AuthBanner message={errorInfo.message} handleBannerData={(value) => setErrorInfo(value)} />}
        <AuthHeaderBase
          header={t("auth.ldap.header.label", { ldapProviderName })}
          subHeader={t("auth.ldap.header.sub_header", { ldapProviderName })}
        />
        <LDAPForm nextPath={nextPath} onBack={() => void navigate("/")} />
        <TermsAndConditions authType={EAuthModes.SIGN_IN} />
      </div>
    </div>
  );
});
