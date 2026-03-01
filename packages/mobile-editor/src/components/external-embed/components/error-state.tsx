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

import { useEffect, useState } from "react";
import {
  AccessDeniedDark,
  AccessDeniedLight,
  ErrorDark,
  ErrorLight,
  NotFoundDark,
  NotFoundLight,
  BrokenLinkLight,
  BrokenLinkDark,
} from "@plane/ui";
import { cn } from "@plane/utils";

interface ErrorStateProps {
  error: string;
  href: string;
  code: string;
  theme: string;
}

const getErrorDetails = (errorCode: string = "", theme: string) => {
  const isDarkTheme = theme === "dark";

  switch (errorCode) {
    case "CONTENT_NOT_FOUND":
      return {
        title: "Not found",
        errorIcon: isDarkTheme ? <NotFoundDark /> : <NotFoundLight />,
      };
    case "CONTENT_PRIVATE":
      return {
        title: "Access denied",
        errorIcon: isDarkTheme ? <AccessDeniedDark /> : <AccessDeniedLight />,
      };
    case "CONTENT_REMOVED":
      return {
        title: "Content removed",
        errorIcon: isDarkTheme ? <BrokenLinkDark /> : <BrokenLinkLight />,
      };
    case "TIMEOUT":
    case "UNSUPPORTED_CONTENT":
    default:
      return {
        title:
          errorCode === "TIMEOUT"
            ? "Request timeout"
            : errorCode === "UNSUPPORTED_CONTENT"
              ? "Unsupported content"
              : "Error",
        errorIcon: isDarkTheme ? <ErrorDark /> : <ErrorLight />,
      };
  }
};

export const ErrorState = ({ error, href, code, theme }: ErrorStateProps) => {
  // state
  const [isVisible, setIsVisible] = useState(false);
  // derived
  const { title, errorIcon: IconComponent } = getErrorDetails(code, theme);

  useEffect(() => {
    // Small delay to ensure the animation starts after component is mounted
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={cn(
        "flex-col items-center rounded-lg border border-custom-border-200 bg-custom-background-50",
        isVisible ? "animate-fade-in opacity-100" : "opacity-0 translate-y-2.5"
      )}
    >
      <div className="flex  border-b border-custom-border-200">
        <div className="mx-3 flex-shrink-0 flex items-center justify-center border-r border-custom-border-200">
          {IconComponent}
        </div>
        <div className="flex-col items-center justify-center">
          <h3 className="text-base font-medium text-custom-text-100 mb-1">{title}</h3>
          <p className="text-sm text-custom-text-200">{error}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-auto p-1">
        <a href={href} className="text-xs text-custom-text-300 truncate">
          {href}
        </a>
      </div>
    </div>
  );
};
