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

import React from "react";
import { cn } from "../utils";
import type { TBannerVariant } from "./helper";
import {
  getBannerStyling,
  getBannerIconStyling,
  getBannerTitleStyling,
  getBannerActionStyling,
  getBannerDismissStyling,
  getBannerDismissIconStyling,
} from "./helper";

export interface BannerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Visual variant of the banner */
  variant?: TBannerVariant;
  /** Icon to display before the title */
  icon?: React.ReactNode;
  /** Banner title/message */
  title?: React.ReactNode;
  /** Action elements to display on the right side */
  action?: React.ReactNode;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
  /** Callback when banner is dismissed */
  onDismiss?: () => void;
  /** Whether to show the banner */
  visible?: boolean;
  /** Animation duration for show/hide */
  animationDuration?: number;
}

export const Banner = React.forwardRef(function Banner(
  {
    icon,
    title,
    action,
    variant = "info",
    dismissible = false,
    onDismiss,
    visible = true,
    animationDuration = 200,
    className,
    children,
    ...props
  }: BannerProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  // Handle dismissal
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  // Get styling using helper functions
  const containerStyling = getBannerStyling(variant);
  const iconStyling = getBannerIconStyling(variant);
  const titleStyling = getBannerTitleStyling(variant);
  const actionStyling = getBannerActionStyling();
  const dismissStyling = getBannerDismissStyling();
  const dismissIconStyling = getBannerDismissIconStyling();

  // Render custom icon component if provided
  const renderIcon = () => {
    if (icon) {
      return <div className={cn(iconStyling)}>{icon}</div>;
    }
    return null;
  };

  // Render dismiss button if dismissible
  const renderDismissButton = () => {
    if (!dismissible) return null;

    return (
      <button onClick={handleDismiss} className={cn(dismissStyling)} aria-label="Dismiss banner">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(dismissIconStyling)}
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    );
  };

  return (
    <div
      ref={ref}
      className={cn(containerStyling, className)}
      style={{
        transitionDuration: `${animationDuration}ms`,
      }}
      {...props}
    >
      {/* Left side: Icon and Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {renderIcon()}
        {title && <div className={cn(titleStyling)}>{title}</div>}
        {children}
      </div>

      {/* Right side: Actions */}
      {(action || dismissible) && (
        <div className={cn(actionStyling)}>
          {action}
          {renderDismissButton()}
        </div>
      )}
    </div>
  );
});

Banner.displayName = "Banner";

// Export variant types for external use
export type BannerVariant = TBannerVariant;
