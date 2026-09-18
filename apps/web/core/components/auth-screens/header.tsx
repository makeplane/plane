/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
import { BRAND_NAME } from "@plane/constants";
import { BrandMark } from "@/components/common/brand-mark";
import { PageHead } from "@/components/core/page-title";
import { EAuthModes } from "@/helpers/authentication.helper";
import { useInstance } from "@/hooks/store/use-instance";

const authContentMap = {
  [EAuthModes.SIGN_IN]: {
    pageTitle: "Sign in",
    text: "auth.common.new_to_plane",
    linkText: "auth.common.create_account",
    linkHref: "/sign-up",
  },
  [EAuthModes.SIGN_UP]: {
    pageTitle: "Sign up",
    text: "auth.common.already_have_an_account",
    linkText: "auth.common.login",
    linkHref: "/sign-in",
  },
};

type AuthHeaderProps = {
  type: EAuthModes;
};

export const AuthHeader = observer(function AuthHeader({ type }: AuthHeaderProps) {
  const { t } = useTranslation();
  // store
  const { config } = useInstance();
  // derived values
  // Turning open registration off only makes this deployment invite-only: the
  // administrator still hands out invite codes, so the way to the sign-up form
  // has to stay on screen, otherwise the codes can never be redeemed.
  const isInviteOnlySignUp = !(config?.enable_signup ?? false);
  const authContent = authContentMap[type];

  return (
    <AuthHeaderBase
      pageTitle={t(authContent.pageTitle)}
      additionalAction={
        <div className="flex flex-col items-end text-center text-13 font-medium text-tertiary sm:flex-row sm:items-center sm:gap-2">
          <span className="text-body-sm-regular text-tertiary">{t(authContent.text)}</span>
          <Link href={authContent.linkHref} className="text-body-sm-semibold text-accent-primary hover:underline">
            {t(authContent.linkText)}
          </Link>
          {isInviteOnlySignUp && type === EAuthModes.SIGN_IN && (
            <span className="text-body-sm-regular text-tertiary">{t("auth.common.invite_only")}</span>
          )}
        </div>
      }
    />
  );
});

type TAuthHeaderBase = {
  pageTitle: string;
  additionalAction?: React.ReactNode;
};

export function AuthHeaderBase(props: TAuthHeaderBase) {
  const { pageTitle, additionalAction } = props;
  return (
    <>
      <PageHead title={`${pageTitle} - ${BRAND_NAME}`} />
      <div className="sticky top-0 flex w-full flex-shrink-0 items-center justify-between gap-6">
        <Link href="/">
          <BrandMark className="h-5 text-primary" />
        </Link>
        {additionalAction}
      </div>
    </>
  );
}
