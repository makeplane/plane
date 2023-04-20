import React, { useEffect } from "react";

import Link from "next/link";

type Props = {
  position: {
    x: number;
    y: number;
  };
  children: React.ReactNode;
  title?: string | JSX.Element;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const ContextMenu = ({ position, children, title, isOpen, setIsOpen }: Props) => {
  useEffect(() => {
    const hideContextMenu = () => {
      if (isOpen) setIsOpen(false);
    };

    window.addEventListener("click", hideContextMenu);
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") hideContextMenu();
    });

    return () => {
      window.removeEventListener("click", hideContextMenu);
      window.removeEventListener("keydown", hideContextMenu);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div
      className={`fixed z-20 h-full w-full ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        className={`fixed z-20 flex min-w-[8rem] flex-col items-stretch gap-1 rounded-md border border-brand-base bg-brand-surface-2 p-2 text-xs shadow-lg`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {title && <h4 className="border-b px-1 py-1 pb-2 text-[0.8rem] font-medium">{title}</h4>}
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
          className={`${className} flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-brand-secondary hover:bg-brand-surface-1 hover:text-brand-base`}
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
        className={`${className} flex w-full items-center gap-2 rounded px-1 py-1.5 text-left text-brand-secondary hover:bg-brand-surface-1 hover:text-brand-base`}
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
