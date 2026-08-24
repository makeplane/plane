/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const DEFAULT_BRAND_NAME = "Plane";
export const DEFAULT_BRAND_SUPPORT_EMAIL = "support@plane.so";
export const DEFAULT_BRAND_WEBSITE_URL = "https://plane.so";

export const resolveBrandSupportEmail = (instanceEmail?: string | null, fallback = DEFAULT_BRAND_SUPPORT_EMAIL) => {
  const trimmed = instanceEmail?.trim();
  return trimmed || fallback;
};

export const resolveBrandWebsiteUrl = (instanceUrl?: string | null, fallback = DEFAULT_BRAND_WEBSITE_URL) => {
  const trimmed = instanceUrl?.trim();
  return trimmed || fallback;
};

export const resolveBrandName = (instanceName?: string | null, fallback = DEFAULT_BRAND_NAME) => {
  const trimmed = instanceName?.trim();
  return trimmed || fallback;
};

export const hasCustomBrandLogo = (logoUrl?: string | null) => Boolean(logoUrl?.trim());

export const shouldHidePlaneMarketing = (hide?: boolean) => Boolean(hide);
