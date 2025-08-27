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
export const ErrorState = ({ error, code, theme }: ErrorStateProps) => {
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
        "flex items-center rounded-lg border border-custom-border-200 bg-custom-background-50 h-20 my-2 transition-all duration-500",
        isVisible ? "animate-fade-in opacity-100" : "opacity-0 translate-y-2.5"
      )}
    >
      <div className="mx-3 flex-shrink-0 flex items-center justify-center">{IconComponent}</div>
      <div className="flex-1">
        <h3 className="text-base font-medium text-custom-text-100 mb-1">{title}</h3>
        <p className="text-sm text-custom-text-200">{error}</p>
      </div>
    </div>
  );
};
