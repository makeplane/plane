/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useEffect, useRef, useState } from "react";
import { Tooltip as PropelTooltip } from "@plane/propel/tooltip";
import type { TPlacement } from "@plane/propel/utils";

/**
 * Kept as an alias so existing `TPosition` consumers keep compiling.
 *
 * The previous Blueprint-backed implementation also accepted `bottom-left`,
 * `left-top`, `top-right` and friends. Those have no equivalent in the design
 * system's placement vocabulary (which spells them `bottom-start`, `top-end`, ...)
 * and no call site in the repo used them.
 */
export type TPosition = TPlacement;

interface ITooltipProps {
  tooltipHeading?: string;
  tooltipContent: string | React.ReactNode;
  position?: TPosition;
  // React 19 defaults ReactElement's props to `unknown`; propel's Tooltip needs a
  // named props shape, so mirror it here rather than casting at the call site.
  children: React.ReactElement<Record<string, unknown>>;
  disabled?: boolean;
  className?: string;
  openDelay?: number;
  closeDelay?: number;
  isMobile?: boolean;
  renderByDefault?: boolean;
}

export function Tooltip({
  tooltipHeading,
  tooltipContent,
  position = "top",
  children,
  disabled = false,
  className = "",
  openDelay = 200,
  closeDelay,
  isMobile = false,

  //FIXME: tooltip should always render on hover and not by default, this is a temporary fix
  renderByDefault = true,
}: ITooltipProps) {
  const toolTipRef = useRef<HTMLDivElement | null>(null);

  const [shouldRender, setShouldRender] = useState(renderByDefault);

  const onHover = () => {
    setShouldRender(true);
  };

  useEffect(() => {
    const element = toolTipRef.current as any;

    if (!element) return;

    element.addEventListener("mouseenter", onHover);

    return () => {
      element?.removeEventListener("mouseenter", onHover);
    };
  }, [toolTipRef, shouldRender]);

  if (!shouldRender) {
    return (
      <div ref={toolTipRef} className="flex h-full items-center">
        {children}
      </div>
    );
  }

  return (
    <PropelTooltip
      tooltipHeading={tooltipHeading}
      tooltipContent={tooltipContent}
      position={position}
      disabled={disabled}
      className={className}
      openDelay={openDelay}
      closeDelay={closeDelay}
      isMobile={isMobile}
    >
      {children}
    </PropelTooltip>
  );
}
