import React, { useEffect, useRef } from "react";

import Link from "next/link";

// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";

type Props = {
  clickEvent: React.MouseEvent | null;
  children: React.ReactNode;
  title?: string | JSX.Element;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ContextMenu = ({ clickEvent, children, title, isOpen, setIsOpen }: Props) => {
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Close the context menu when clicked outside
  useOutsideClickDetector(contextMenuRef, () => {
    if (isOpen) setIsOpen(false);
  });

  useEffect(() => {
    const hideContextMenu = () => {
      if (isOpen) setIsOpen(false);
    };

    const escapeKeyEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") hideContextMenu();
    };

    window.addEventListener("click", hideContextMenu);
    window.addEventListener("keydown", escapeKeyEvent);

    return () => {
      window.removeEventListener("click", hideContextMenu);
      window.removeEventListener("keydown", escapeKeyEvent);
    };
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    const contextMenu = contextMenuRef.current;

    if (contextMenu && isOpen) {
      const contextMenuWidth = contextMenu.clientWidth;
      const contextMenuHeight = contextMenu.clientHeight;

      const clickX = clickEvent?.pageX || 0;
      const clickY = clickEvent?.pageY || 0;

      let top = clickY;
      // check if there's enough space at the bottom, otherwise show at the top
      if (clickY + contextMenuHeight > window.innerHeight) top = clickY - contextMenuHeight;

      // check if there's enough space on the right, otherwise show on the left
      let left = clickX;
      if (clickX + contextMenuWidth > window.innerWidth) left = clickX - contextMenuWidth;

      contextMenu.style.top = `${top}px`;
      contextMenu.style.left = `${left}px`;
    }
  }, [clickEvent, isOpen]);

  return (
    <div
      className={`fixed z-50 top-0 left-0 h-full w-full ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        ref={contextMenuRef}
        className={`fixed z-50 flex min-w-[8rem] flex-col items-stretch gap-1 rounded-md border border-custom-border-200 bg-custom-background-90 p-2 text-xs shadow-lg`}
      >
        {title && (
          <h4 className="border-b border-custom-border-200 px-1 py-1 pb-2 text-[0.8rem] font-medium">
            {title}
          </h4>
        )}
        {children}
      </div>
    </div>
  );
};

type MenuItemProps = {
  children: JSX.Element | string;
  renderAs?: "button" | "a";
  href?: string;
  onClick?: () => void;
  className?: string;
  Icon?: any;
};

const MenuItem: React.FC<MenuItemProps> = ({
  children,
  renderAs,
  href = "",
  onClick,
  className = "",
  Icon,
}) => (
  <>
    {renderAs === "a" ? (
      <Link href={href}>
        <a
          className={`${className} flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80`}
        >
          <>
            {Icon && <Icon />}
            {children}
          </>
        </a>
      </Link>
    ) : (
      <button
        type="button"
        className={`${className} flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80`}
        onClick={onClick}
      >
        <>
          {Icon && <Icon height={12} width={12} />}
          {children}
        </>
      </button>
    )}
  </>
);

ContextMenu.Item = MenuItem;

export { ContextMenu };
