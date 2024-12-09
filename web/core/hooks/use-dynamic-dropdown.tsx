import React, { useCallback, useEffect } from "react";
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";

/**
 * Custom hook for dynamic dropdown position calculation.
 * @param isOpen - Indicates whether the dropdown is open.
 * @param handleClose - Callback to handle closing the dropdown.
 * @param buttonRef - Ref object for the button triggering the dropdown.
 * @param dropdownRef - Ref object for the dropdown element.
 */

const useDynamicDropdownPosition = (
  isOpen: boolean,
  handleClose: () => void,
  buttonRef: React.RefObject<any>,
  dropdownRef: React.RefObject<any>
) => {
  const handlePosition = useCallback(() => {
    const button = buttonRef.current;
    const dropdown = dropdownRef.current;

    if (!dropdown || !button) return;

    const buttonRect = button.getBoundingClientRect();
    const dropdownRect = dropdown.getBoundingClientRect();

    const { innerHeight, innerWidth, scrollX, scrollY } = window;

    let top: number = buttonRect.bottom + scrollY;
    if (top + dropdownRect.height > innerHeight) top = innerHeight - dropdownRect.height;

    let left: number = buttonRect.left + scrollX + (buttonRect.width - dropdownRect.width) / 2;
    if (left + dropdownRect.width > innerWidth) left = innerWidth - dropdownRect.width;

    dropdown.style.top = `${Math.max(top, 5)}px`;
    dropdown.style.left = `${Math.max(left, 5)}px`;
  }, [buttonRef, dropdownRef]);

  useEffect(() => {
    if (isOpen) handlePosition();
  }, [handlePosition, isOpen]);

  useOutsideClickDetector(dropdownRef, () => {
    if (isOpen) handleClose();
  });

  const handleResize = useCallback(() => {
    if (isOpen) {
      handlePosition();
    }
  }, [handlePosition, isOpen]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, handleResize]);
};

export default useDynamicDropdownPosition;
