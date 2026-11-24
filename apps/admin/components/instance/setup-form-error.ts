/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
// plane imports
import { EAdminAuthErrorCodes, EAuthErrorCodes } from "@plane/constants";
// helpers
import { authErrorHandler } from "@/app/(all)/(home)/auth-helpers";

export type TSetupFormError = {
  field: "email" | "password" | "banner" | undefined;
  message: ReactNode;
};

/**
 * @description maps the numeric `error_code` the admin sign-up API redirects back with to where the
 * instance setup form shows it: email and password errors inline, everything else in a banner
 * @param {string | undefined} errorCode
 * @returns {TSetupFormError}
 */
export const getSetupFormError = (errorCode: string | undefined): TSetupFormError => {
  if (!errorCode) return { field: undefined, message: undefined };
  switch (errorCode) {
    case EAdminAuthErrorCodes.INVALID_ADMIN_EMAIL:
      return { field: "email", message: "Please enter a valid email address." };
    case EAuthErrorCodes.PASSWORD_TOO_WEAK:
      return { field: "password", message: "Password is too weak. Please choose a stronger password." };
    case EAuthErrorCodes.INSTANCE_NOT_CONFIGURED:
      return { field: "banner", message: "Instance is not configured. Please contact your administrator." };
    default:
      return {
        field: "banner",
        message:
          authErrorHandler(errorCode as EAdminAuthErrorCodes)?.message ?? "Something went wrong. Please try again.",
      };
  }
};
