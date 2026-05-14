/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
// helpers
import { EAuthModes } from "@/types/auth";

type TAuthHeader = {
  authMode: EAuthModes;
};

export function AuthHeader(props: TAuthHeader) {
  const { authMode } = props;
  const { t } = useTranslation();

  const header =
    authMode === EAuthModes.SIGN_IN
      ? t("localized_ui.space_public.auth.sign_in_header")
      : t("localized_ui.space_public.auth.sign_up_header");
  const subHeader =
    authMode === EAuthModes.SIGN_IN
      ? t("localized_ui.space_public.auth.sign_in_subheader")
      : t("localized_ui.space_public.auth.sign_up_subheader");

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-20 leading-7 font-semibold text-primary">{header}</span>
        <span className="text-20 leading-7 font-semibold text-placeholder">{subHeader}</span>
      </div>
    </>
  );
}
