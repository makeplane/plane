import React, { useEffect, useState } from "react";

export type Props = {
  direction?: "top" | "right" | "bottom" | "left";
  content: string | React.ReactNode;
  margin?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export const Tooltip: React.FC<Props> = ({
  content,
  direction = "top",
  children,
  margin = "24px",
  className = "",
  disabled = false,
}) => {
  const [active, setActive] = useState(false);
  const [styleConfig, setStyleConfig] = useState(`top-[calc(-100%-${margin})]`);
  let timeout: any;

  const showToolTip = () => {
    timeout = setTimeout(() => {
      setActive(true);
    }, 300);
  };

  const hideToolTip = () => {
    clearInterval(timeout);
    setActive(false);
  };

  const tooltipStyles = {
    top: "left-[50%] translate-x-[-50%] before:contents-[''] before:border-solid before:border-transparent before:h-0 before:w-0 before:absolute before:pointer-events-none before:border-[6px] before:left-[50%] before:ml-[calc(6px*-1)] before:top-full before:border-t-black",

    right: "right-[-100%] top-[50%] translate-x-0 translate-y-[-50%]",

    bottom:
      "left-[50%] translate-x-[-50%] before:contents-[''] before:border-solid before:border-transparent before:h-0 before:w-0 before:absolute before:pointer-events-none before:border-[6px] before:left-[50%] before:ml-[calc(6px*-1)] before:bottom-full before:border-b-black",

    left: "left-[-100%] top-[50%] translate-x-0 translate-y-[-50%]",
  };

  useEffect(() => {
    const styleConfig = `${direction}-[calc(-100%-${margin})]`;
    setStyleConfig(styleConfig);
  }, [margin, direction]);

  return (
    <div className="relative inline-block" onMouseEnter={showToolTip} onMouseLeave={hideToolTip}>
      {children}
      {active && (
        <div
          className={`${className} ${
            disabled ? "hidden" : ""
          } absolute p-[6px] text-xs z-20 rounded leading-1 text-white bg-black text-center w-max max-w-[300px] 
          ${tooltipStyles[direction]} ${styleConfig}`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
