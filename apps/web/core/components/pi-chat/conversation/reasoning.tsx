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

import { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { Brain, ChevronDownIcon } from "lucide-react";
import { cn } from "@plane/utils";

type TProps = {
  reasoning?: string;
  isThinking: boolean | undefined;
  currentTick?: string;
};

const stripEmojis = (str: string) => str.replace(/\p{Emoji}/gu, "");

export const ReasoningBlock = (props: TProps) => {
  const { reasoning, isThinking, currentTick } = props;
  const [manuallyToggled, setManuallyToggled] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when reasoning content updates
  useEffect(() => {
    if (isThinking && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [reasoning, isThinking]);

  // Handle auto-close with delay when thinking stops
  useEffect(() => {
    if (!isThinking && !manuallyToggled && isOpen) {
      // Use setTimeout to avoid synchronous setState in effect
      const closeTimer = setTimeout(() => {
        setIsOpen(false);
      }, 500);
      return () => {
        clearTimeout(closeTimer);
      };
    }
  }, [isThinking, manuallyToggled, isOpen]);

  const handleToggle = () => {
    setManuallyToggled(true);
    setIsOpen((prev) => !prev);
  };

  return (
    <div className={cn("flex flex-col")}>
      {!isThinking && (
        <button className="flex items-center gap-2" onClick={handleToggle}>
          <Brain className="w-4 h-4 text-secondary flex-shrink-0" />
          <span className="text-body-sm-medium text-secondary">Thought for a few seconds</span>
          <ChevronDownIcon
            className={`text-icon-tertiary size-3.5 transition-transform duration-500 ease-in-out ${isOpen ? "transform rotate-180" : ""}`}
          />
        </button>
      )}
      <div
        className={cn("rounded-xl bg-surface-1  border-subtle transition-all duration-500 ease-in-out ", {
          "my-2": isOpen,
          "border ": isThinking || isOpen,
        })}
      >
        {isThinking && (
          <button
            onClick={handleToggle}
            aria-expanded={isOpen}
            className={cn(
              "flex items-center gap-2 w-full px-3 transition-all duration-500 ease-in-out hover:border-transparent py-2",
              {
                "pb-2": !isOpen,
              }
            )}
          >
            <div className="w-2 h-4 animate-vertical-scale bg-inverse shrink-0" />
            <div className={cn("flex gap-2 items-center text-body-sm-regular truncate")}>
              <span className="shimmer">{stripEmojis(currentTick || "Thinking")}</span>
            </div>
            <ChevronDownIcon
              className={`w-4 h-4 transition-transform duration-500 ease-in-out flex-shrink-0 ${isOpen ? "transform rotate-180" : ""}`}
            />
          </button>
        )}
        <div
          className={cn(
            "overflow-hidden",
            "transition-all duration-500 ease-in-out",

            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 mt-0"
          )}
        >
          <div
            ref={contentRef}
            className="mx-3 overflow-y-auto text-tertiary relative max-h-80 scrollbar-thin scrollbar-thumb-subtle scrollbar-track-transparent"
          >
            <Markdown className="pi-chat-root [&>*]:mt-0 text-body-xs-regular border-l border-subtle-1 [&>*]:pl-4 [&>*]:relative">
              {reasoning}
            </Markdown>
          </div>
        </div>
      </div>
    </div>
  );
};
