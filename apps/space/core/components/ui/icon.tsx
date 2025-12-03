import React from "react";

type Props = {
  iconName: string;
  className?: string;
};

export function Icon({ iconName, className = "" }: Props) {
  return <span className={`material-symbols-rounded text-13 font-light leading-5 ${className}`}>{iconName}</span>;
}
