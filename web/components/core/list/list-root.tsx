import React, { FC } from "react";

interface IListContainer {
  children: React.ReactNode;
}

export const ListLayout: FC<IListContainer> = (props) => {
  const { children } = props;
  return <div className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg">{children}</div>;
};
