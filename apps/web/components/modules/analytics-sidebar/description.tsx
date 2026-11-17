/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useId, useRef, useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type Props = {
  description: string;
};

/** The module description, clamped to two lines with a "Show all" / "Show less" toggle when it is longer. */
export function ModuleSidebarDescription(props: Props) {
  const { description } = props;
  // refs
  const textRef = useRef<HTMLParagraphElement>(null);
  // states
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  // hooks
  const { t } = useTranslation();
  const textId = useId();

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    // Only measurable while clamped; once expanded the toggle stays until the user collapses it again.
    const measure = () => {
      if (!isExpanded) setIsClamped(element.scrollHeight > element.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [description, isExpanded]);

  return (
    <div className="flex flex-col items-start gap-2">
      <p
        ref={textRef}
        id={textId}
        className={cn("w-full text-body-xs-regular wrap-break-word whitespace-pre-wrap text-secondary", {
          "line-clamp-2": !isExpanded,
        })}
      >
        {description}
      </p>
      {(isExpanded || isClamped) && (
        <button
          type="button"
          className="rounded-xs text-caption-md-medium text-accent-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-accent-strong"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls={textId}
        >
          {isExpanded ? t("show_less") : t("show_all")}
        </button>
      )}
    </div>
  );
}
