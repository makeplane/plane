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

import { useState, useEffect } from "react";
// plane ui
import { ThumbnailNotFoundLight, ThumbnailNotFoundDark } from "@plane/ui";
// components
import { ClickableDiv } from "@/components/common";
// constants
import { CallbackHandlerStrings } from "@/constants/callback-handler-strings";
// helpers
import { callNative } from "@/helpers";
// types
import type { IframelyResponse } from "./types";
interface RichCardProps {
  iframelyData: IframelyResponse;
  src: string;
  theme: string;
  showLoading?: boolean;
}

export const RichCard = ({ iframelyData, src, theme, showLoading = true }: RichCardProps) => {
  const domain = new URL(iframelyData.meta?.canonical || src).hostname;
  const thumbnail = iframelyData.links?.thumbnail?.[0]?.href;
  const icon = iframelyData.links?.icon?.[0]?.href;
  const [isVisible, setIsVisible] = useState(!showLoading);
  const { title, description } = iframelyData.meta || {};
  const isDarkTheme = theme === "dark";

  useEffect(() => {
    if (!showLoading) return;

    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [showLoading]);

  return (
    <ClickableDiv
      onClick={() => {
        void callNative(CallbackHandlerStrings.onOpenLink, src);
      }}
      className={
        "flex-col bg-custom-background-800 rounded-lg overflow-hidden my-4 border border-custom-border-200 hover:bg-custom-background-700 hover:border-custom-border-300"
      }
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div className="flex h-[130px] border-b border-custom-border-200">
        {thumbnail ? (
          <div className="w-[140px] h-full bg-custom-background-700 flex-shrink-0 border-r border-custom-border-200">
            <img src={thumbnail} alt={title || "Thumbnail"} className="w-full h-full object-cover" loading="lazy" />
          </div>
        ) : isDarkTheme ? (
          <div className="w-[140px] h-full bg-custom-background-700 flex-shrink-0 border-r border-custom-border-200 flex items-center justify-center">
            <ThumbnailNotFoundDark width={200} height={130} />
          </div>
        ) : (
          <div className="w-[140px] h-full bg-custom-background-700 flex-shrink-0 border-r border-custom-border-200 flex items-center justify-center">
            <ThumbnailNotFoundLight width={200} height={130} />
          </div>
        )}

        <div className="flex-1 my-auto py-3 px-4 flex flex-col h-full overflow-hidden">
          <div className="flex-1 flex flex-col justify-center">
            <div className="text-sm leading-5 text-custom-text-100 font-medium line-clamp-2 mb-2">
              {title || domain}
            </div>
            {description && <div className="text-xs text-custom-text-200 line-clamp-3">{description}</div>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mt-auto p-1">
        {icon && <img src={icon} alt="Site icon" className="w-4 h-4 flex-shrink-0" />}
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs leading-4 text-custom-text-200 hover:text-custom-text-100 whitespace-nowrap overflow-hidden text-ellipsis transition-colors duration-200 flex-1"
        >
          {src}
        </a>
      </div>
    </ClickableDiv>
  );
};
