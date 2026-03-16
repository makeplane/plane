/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";

// ui
import { Button } from "@plane/propel/button";

type Props = {
  title: string;
  description?: React.ReactNode;
  image: any;
  comicBox?: {
    direction: "left" | "right";
    title: string;
    description: string;
    extraPadding?: boolean;
  };
  primaryButton?: {
    icon?: any;
    text: string;
    onClick: () => void;
  };
  disabled?: boolean;
};

export function NewEmptyState({ title, description, image, primaryButton, disabled = false, comicBox }: Props) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  return (
    <div className="flex items-center justify-center overflow-y-auto">
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div className="shadow-sm m-5 flex max-w-6xl flex-col gap-5 rounded-xl border border-subtle px-10 py-7 md:m-8">
          <h3 className="text-20 font-semibold">{title}</h3>
          {description && <p className="text-16">{description}</p>}
          <div className="relative w-full max-w-6xl">
            <img src={image} className="h-full w-full object-contain" alt={primaryButton?.text || "button image"} />
          </div>

          <div className="relative flex items-start justify-center">
            {primaryButton && (
              <Button
                className={`relative m-3 max-w-min !px-6 ${comicBox?.direction === "left" ? "flex-row-reverse" : ""}`}
                size="xl"
                variant="primary"
                onClick={primaryButton.onClick}
                disabled={disabled}
              >
                {primaryButton.text}
                <div
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  className={`bg-blue-300 absolute ${
                    comicBox?.direction === "left" ? "left-0 ml-2" : "right-0 mr-2"
                  } z-10 h-2.5 w-2.5 animate-ping rounded-full`}
                />
                <div
                  className={`bg-blue-400/40 absolute ${
                    comicBox?.direction === "left" ? "left-0 ml-2.5" : "right-0 mr-2.5"
                  } h-1.5 w-1.5 rounded-full`}
                />
              </Button>
            )}
            {comicBox &&
              isHovered &&
              (comicBox.direction === "right" ? (
                <div
                  className={`absolute top-0 left-1/2 flex max-w-sm ${
                    comicBox?.extraPadding ? "ml-[125px]" : "ml-[90px]"
                  } pb-5`}
                >
                  <div className="relative mt-5 h-0 w-0 border-t-[11px] border-r-[11px] border-b-[11px] border-subtle border-y-transparent">
                    <div className="border-surface-1 absolute top-[-10px] right-[-12px] h-0 w-0 border-t-[10px] border-r-[10px] border-b-[10px] border-y-transparent" />
                  </div>
                  <div className="rounded-md border border-subtle bg-surface-1">
                    <h1 className="p-5">
                      <h3 className="text-16 font-semibold">{comicBox?.title}</h3>
                      <h4 className="mt-1 text-13">{comicBox?.description}</h4>
                    </h1>
                  </div>
                </div>
              ) : (
                <div className="absolute top-0 right-1/2 mr-[90px] flex max-w-sm flex-row-reverse pb-5">
                  <div className="relative mt-5 h-0 w-0 border-t-[11px] border-b-[11px] border-l-[11px] border-subtle border-y-transparent">
                    <div className="border-surface-1 absolute top-[-10px] left-[-12px] h-0 w-0 border-t-[10px] border-b-[10px] border-l-[10px] border-y-transparent" />
                  </div>
                  <div className="rounded-md border border-subtle bg-surface-1">
                    <h1 className="p-5">
                      <h3 className="text-16 font-semibold">{comicBox?.title}</h3>
                      <h4 className="mt-1 text-13">{comicBox?.description}</h4>
                    </h1>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
