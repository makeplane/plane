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

import React, { useState, useEffect } from "react";
import { cn } from "../utils";
import { AccessDeniedDark } from "./icons/access-denied-dark";
import { AccessDeniedLight } from "./icons/access-denied-light";
import { BrokenLinkDark } from "./icons/broken-link-dark";
import { BrokenLinkLight } from "./icons/broken-link-light";
import { ErrorDark } from "./icons/error-dark";
import { ErrorLight } from "./icons/error-light";
import { NotFoundDark } from "./icons/not-found-dark";
import { NotFoundLight } from "./icons/not-found-light";

type ErrorStateProps = {
  error: string;
  code: string;
  theme: "dark" | "light";
};

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
export function ErrorState({ error, code, theme }: ErrorStateProps) {
  // state
  const [isVisible, setIsVisible] = useState(false);
  // dervied
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
        "flex items-center rounded-lg border border-subtle-1 bg-layer-1 min-h-20 my-2 transition-all duration-500 overflow-hidden",
        isVisible ? "animate-fade-in opacity-100" : "opacity-0 translate-y-2.5"
      )}
    >
      <div className="mx-3 flex-shrink-0 flex items-center justify-center">{IconComponent}</div>
      <div className="flex-1">
        <h3 className="text-14 font-medium text-primary mb-1">{title}</h3>
        <p className="text-13 text-secondary">{error}</p>
      </div>
    </div>
  );
}
