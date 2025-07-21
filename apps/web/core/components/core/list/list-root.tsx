import React, { FC } from "react";
import { Row, ERowVariant } from "@plane/ui";

interface IListContainer {
  children: React.ReactNode;
}

export const ListLayout: FC<IListContainer> = (props) => {
  const { children } = props;
  return (
    <Row
      variant={ERowVariant.HUGGING}
      className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg"
    >
      {children}
    </Row>
  );
};
