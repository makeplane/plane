import React, { FC, ReactNode } from "react";

type ButtonProps = {
  children: ReactNode;
};

export const Button: FC<ButtonProps> = (props) => {
  const { children } = props;
  return <button>{children}</button>;
};
