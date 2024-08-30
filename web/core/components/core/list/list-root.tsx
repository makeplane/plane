import React, { FC } from "react";
import { CustomRow } from "@plane/ui";

interface IListContainer {
  children: React.ReactNode;
}

export const ListLayout: FC<IListContainer> = (props) => {
  const { children } = props;
  return (
    <CustomRow
      variant="hugging"
      className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg"
    >
      {children}
    </CustomRow>
  );
};
