"use client";

import React from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { AUTH_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { PlaneLockup } from "@plane/propel/icons";
import { PageHead } from "@/components/core/page-title";
import { EAuthModes } from "@/helpers/authentication.helper";
import { useInstance } from "@/hooks/store/use-instance";

const authContentMap = {
  [EAuthModes.SIGN_IN]: {
    pageTitle: "Sign up",
    text: "auth.common.new_to_plane",
    linkText: "Sign up",
    linkHref: "/sign-up",
  },
  [EAuthModes.SIGN_UP]: {
    pageTitle: "Sign in",
    text: "auth.common.already_have_an_account",
    linkText: "Sign in",
    linkHref: "/sign-in",
  },
};

type AuthHeaderProps = {
  type: EAuthModes;
};

export const AuthHeader = observer(({ type }: AuthHeaderProps) => {
  const { t } = useTranslation();
  // store
  const { config } = useInstance();
  // derived values
  const enableSignUpConfig = config?.enable_signup ?? false;
  return (
    <>
      <PageHead title={t(authContentMap[type].pageTitle) + " - Plane"} />
      <div className="flex items-center justify-between gap-6 w-full flex-shrink-0 sticky top-0">
        <Link href="/">
          <PlaneLockup height={20} width={95} className="text-custom-text-100" />
        </Link>
        {enableSignUpConfig && (
          <div className="flex flex-col items-end text-sm font-medium text-center sm:items-center sm:gap-2 sm:flex-row text-custom-text-300">
            {t(authContentMap[type].text)}
            <Link
              data-ph-element={AUTH_TRACKER_ELEMENTS.NAVIGATE_TO_SIGN_UP}
              href={authContentMap[type].linkHref}
              className="font-semibold text-custom-primary-100 hover:underline"
            >
              {t(authContentMap[type].linkText)}
            </Link>
          </div>
        )}
      </div>
    </>
  );
});
