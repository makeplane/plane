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

export type TBannerVariant = "success" | "error" | "warning" | "info" | "accent";

export interface IBannerStyling {
  [key: string]: string;
}

export const bannerSizeStyling = {
  container: "py-3 px-6 min-h-12",
  icon: "w-5 h-5",
  title: "text-13",
  action: "gap-2",
};

// TODO: update this with new color once its implemented
// Banner variant styling
export const bannerStyling: IBannerStyling = {
  success: "bg-success-subtle",
  error: "bg-danger-subtle",
  warning: "bg-warning-subtle",
  info: "bg-blue-500/10",
  accent: "bg-accent-subtle",
};

// Base banner styles
export const bannerBaseStyles = "flex items-center justify-between w-full transition-all duration-200";

// Get banner container styling
export const getBannerStyling = (variant: TBannerVariant): string => {
  const variantStyles = bannerStyling[variant];
  const sizeStyles = bannerSizeStyling.container;

  return `${bannerBaseStyles} ${variantStyles} ${sizeStyles}`;
};

// Banner icon color per variant
const bannerIconColor: IBannerStyling = {
  success: "",
  error: "",
  warning: "",
  info: "",
  accent: "text-accent-primary",
};

// Banner title text color per variant
const bannerTitleColor: IBannerStyling = {
  success: "text-secondary",
  error: "text-secondary",
  warning: "text-secondary",
  info: "text-secondary",
  accent: "text-accent-primary",
};

// Get icon styling
export const getBannerIconStyling = (variant: TBannerVariant): string =>
  `flex self-start items-center justify-center flex-shrink-0 ${bannerSizeStyling.icon} ${bannerIconColor[variant]}`;

// Get title styling
export const getBannerTitleStyling = (variant: TBannerVariant): string =>
  `font-medium ${bannerTitleColor[variant]} ${bannerSizeStyling.title}`;

// Get description styling
export const getBannerDescriptionStyling = (): string => `text-tertiary ${bannerSizeStyling.title}`;

// Get action container styling
export const getBannerActionStyling = (): string => `flex items-center flex-shrink-0 ${bannerSizeStyling.action}`;

// Get dismiss button styling
export const getBannerDismissStyling = (): string =>
  "rounded-sm p-1 hover:bg-surface-2 transition-colors flex-shrink-0";

// Get dismiss icon styling
export const getBannerDismissIconStyling = (): string => "text-secondary";
