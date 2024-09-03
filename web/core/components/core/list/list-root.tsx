import React, { FC } from "react";
import { CustomRow } from "@plane/ui";
import { ERowVariant } from "@/helpers/common.helper";

interface IListContainer {
  children: React.ReactNode;
}

export const ListLayout: FC<IListContainer> = (props) => {
  const { children } = props;
  return (
    <CustomRow
      variant={ERowVariant.HUGGING}
      className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg"
    >
      {children}
    </CustomRow>
  );
};
