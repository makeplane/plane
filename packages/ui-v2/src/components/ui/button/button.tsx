import React, { FC, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
};

export const Button: FC<ButtonProps> = (props) => {
  const { children } = props;
  return <button className="bg-brand-200">{children}</button>;
};
