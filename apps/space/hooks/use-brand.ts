/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { SUPPORT_EMAIL, WEBSITE_URL } from "@plane/constants";
import { resolveBrandName, resolveBrandSupportEmail, resolveBrandWebsiteUrl } from "@plane/utils";
import { useInstance } from "@/hooks/store/use-instance";

export const useBrand = () => {
  const { instance, config } = useInstance();
  const { resolvedTheme } = useTheme();

  return useMemo(() => {
    const name = resolveBrandName(instance?.instance_name);
    const lightLogo = config?.brand_logo_url?.trim() || undefined;
    const darkLogo = config?.brand_logo_dark_url?.trim() || undefined;
    const logoUrl = (resolvedTheme === "dark" && darkLogo) || lightLogo || darkLogo;
    const faviconUrl = config?.brand_favicon_url?.trim() || undefined;
    const supportEmail = resolveBrandSupportEmail(config?.brand_support_email, SUPPORT_EMAIL);
    const websiteUrl = resolveBrandWebsiteUrl(config?.brand_website_url, WEBSITE_URL);
    const hidePlaneMarketing = Boolean(config?.hide_plane_marketing);

    return {
      name,
      logoUrl,
      faviconUrl,
      supportEmail,
      websiteUrl,
      hidePlaneMarketing,
    };
  }, [
    config?.brand_favicon_url,
    config?.brand_logo_dark_url,
    config?.brand_logo_url,
    config?.brand_support_email,
    config?.brand_website_url,
    config?.hide_plane_marketing,
    instance?.instance_name,
    resolvedTheme,
  ]);
};
