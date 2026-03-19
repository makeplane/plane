/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useCallback, useRef } from "react";

export type TCollapsibleProps = {
  title: string | React.ReactNode;
  children: React.ReactNode;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  className?: string;
  buttonClassName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
};

export function Collapsible(props: TCollapsibleProps) {
  const { title, children, buttonRef, className, buttonClassName, isOpen, onToggle, defaultOpen } = props;
  // Controlled value takes precedence; otherwise use internal state
  const [localIsOpen, setLocalIsOpen] = useState<boolean>(defaultOpen ?? false);
  const internalRef = useRef<HTMLButtonElement>(null);
  const resolvedButtonRef = (buttonRef ?? internalRef);

  // Display state: controlled mode overrides internal state
  const displayIsOpen = isOpen !== undefined ? isOpen : localIsOpen;

  const handleOnClick = useCallback(() => {
    if (isOpen !== undefined) {
      // Controlled mode — delegate to parent
      if (onToggle) onToggle();
    } else {
      // Uncontrolled mode — manage locally
      setLocalIsOpen((prev) => !prev);
    }
  }, [isOpen, onToggle]);

  return (
    <div className={className} data-state={displayIsOpen ? "open" : "closed"}>
      <button
        ref={resolvedButtonRef}
        type="button"
        className={buttonClassName}
        onClick={handleOnClick}
        aria-expanded={displayIsOpen}
      >
        {title}
      </button>
      {/* CSS grid animation — avoids Tailwind JIT arbitrary value scanning issues with @headlessui Transition */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: displayIsOpen ? "1fr" : "0fr",
          opacity: displayIsOpen ? 1 : 0,
          overflow: "hidden",
          transition: "grid-template-rows 300ms ease-in-out, opacity 300ms ease-in-out",
        }}
      >
        <div style={{ minHeight: 0 }}>{children}</div>
      </div>
    </div>
  );
}
