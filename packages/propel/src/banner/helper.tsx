export type TBannerVariant = "success" | "error" | "warning" | "info";

export interface IBannerStyling {
  [key: string]: string;
}

export const bannerSizeStyling = {
  container: "py-3 px-6 h-12",
  icon: "w-5 h-5",
  title: "text-13",
  action: "gap-2",
};

// TODO: update this with new color once its implemented
// Banner variant styling
export const bannerStyling: IBannerStyling = {
  success: "bg-success-subtle",
  error: "bg-danger-subtle",
  warning: "bg-yellow-500/10",
  info: "bg-blue-500/10",
};

// Base banner styles
export const bannerBaseStyles = "flex items-center justify-between w-full transition-all duration-200";

// Get banner container styling
export const getBannerStyling = (variant: TBannerVariant): string => {
  const variantStyles = bannerStyling[variant];
  const sizeStyles = bannerSizeStyling.container;

  return `${bannerBaseStyles} ${variantStyles} ${sizeStyles}`;
};

// Get title styling
export const getBannerTitleStyling = (): string =>
  `font-medium text-secondary flex-1 min-w-0 ${bannerSizeStyling.title}`;

// Get action container styling
export const getBannerActionStyling = (): string => `flex items-center flex-shrink-0 ${bannerSizeStyling.action}`;

// Get dismiss button styling
export const getBannerDismissStyling = (): string =>
  "rounded-sm p-1 hover:bg-surface-2 transition-colors flex-shrink-0";

// Get dismiss icon styling
export const getBannerDismissIconStyling = (): string => "text-secondary";
