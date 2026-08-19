/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState, useEffect, useCallback } from "react";

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
  // state
  const [localIsOpen, setLocalIsOpen] = useState<boolean>(isOpen !== undefined ? isOpen : !!defaultOpen);

  useEffect(() => {
    if (isOpen !== undefined) {
      setLocalIsOpen(isOpen);
    }
  }, [isOpen]);

  // handlers
  const handleOnClick = useCallback(() => {
    if (isOpen !== undefined) {
      if (onToggle) onToggle();
    } else {
      setLocalIsOpen((prev) => !prev);
    }
  }, [isOpen, onToggle]);

  return (
    <div className={className}>
      <button ref={buttonRef} type="button" className={buttonClassName} onClick={handleOnClick} aria-expanded={localIsOpen}>
        {title}
      </button>
      {localIsOpen && (
        <div className="min-h-0">
          {children}
        </div>
      )}
    </div>
  );
}
