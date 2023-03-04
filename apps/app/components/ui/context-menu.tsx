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
    const hideContextMenu = () => setIsOpen(false);

    window.addEventListener("click", hideContextMenu);

    return () => {
      window.removeEventListener("click", hideContextMenu);
    };
  }, [setIsOpen]);

  return (
    <div
      className={`fixed z-20 h-full w-full ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div
        className={`fixed z-20 flex min-w-[8rem] flex-col items-stretch gap-1 rounded-md border bg-white p-2 text-xs shadow-lg`}
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
  <div className={`${className} w-full rounded px-1 py-1.5 text-left hover:bg-hover-gray`}>
    {renderAs === "a" ? (
      <Link href={href}>
        <a className="flex items-center gap-2">
          <>
            {Icon && <Icon />}
            {children}
          </>
        </a>
      </Link>
    ) : (
      <button type="button" className="flex items-center gap-2" onClick={onClick}>
        <>
          {Icon && <Icon height={12} width={12} />}
          {children}
        </>
      </button>
    )}
  </div>
);

ContextMenu.Item = MenuItem;

export { ContextMenu };
