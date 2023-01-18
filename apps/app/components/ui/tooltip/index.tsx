import React from "react";

type Props = {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
};

const Tooltip: React.FC<Props> = ({ children, content, position = "top" }) => (
    <div className="relative group">
      <div
        className={`fixed pointer-events-none transition-opacity opacity-0 group-hover:opacity-100 bg-black text-white px-3 py-1 rounded ${
          position === "right"
            ? "left-14"
            : position === "left"
            ? "right-14"
            : position === "top"
            ? "bottom-14"
            : "top-14"
        }`}
      >
        <p className="truncate text-xs">{content}</p>
        <span
          className={`absolute w-2 h-2 bg-black ${
            position === "top"
              ? "top-full left-1/2 transform -translate-y-1/2 -translate-x-1/2 rotate-45"
              : position === "bottom"
              ? "bottom-full left-1/2 transform translate-y-1/2 -translate-x-1/2 rotate-45"
              : position === "left"
              ? "left-full top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45"
              : "right-full top-1/2 transform translate-x-1/2 -translate-y-1/2 rotate-45"
          }`}
         />
      </div>
      {children}
    </div>
  );

export default Tooltip;
