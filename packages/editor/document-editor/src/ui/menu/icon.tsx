import React from "react";

type Props = {
  iconName: string;
  className?: string;
};

export const Icon: React.FC<Props> = ({ iconName, className = "" }) => (
  <span className={`material-symbols-rounded text-sm leading-5 font-light ${className}`}>
    {iconName}
  </span>
);

