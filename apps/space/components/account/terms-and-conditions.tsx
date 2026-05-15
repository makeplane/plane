/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";

type Props = {
  isSignUp?: boolean;
};

export function TermsAndConditions(props: Props) {
  const { isSignUp = false } = props;
  const { t } = useTranslation();
  return (
    <span className="flex items-center justify-center py-6">
      <p className="text-center text-13 whitespace-pre-line text-secondary">
        {isSignUp ? t("space_public.by_creating_account") : t("space_public.by_signing_in")},{" "}
        {t("space_public.you_agree_to_our")}
        {" \n"}
        <a href="https://plane.so/legals/terms-and-conditions" target="_blank" rel="noopener noreferrer">
          <span className="text-13 font-medium underline hover:cursor-pointer">
            {t("space_public.terms_of_service")}
          </span>
        </a>{" "}
        {t("space_public.and")}{" "}
        <a href="https://plane.so/legals/privacy-policy" target="_blank" rel="noopener noreferrer">
          <span className="text-13 font-medium underline hover:cursor-pointer">{t("space_public.privacy_policy")}</span>
        </a>
        {"."}
      </p>
    </span>
  );
}
