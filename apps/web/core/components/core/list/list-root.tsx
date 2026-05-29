import React from "react";
import { Row, ERowVariant } from "@plane/ui";

interface IListContainer {
  children: React.ReactNode;
}

export function ListLayout(props: IListContainer) {
  const { children } = props;
  return (
    <Row
      variant={ERowVariant.HUGGING}
      className="vertical-scrollbar flex scrollbar-lg h-full w-full flex-col overflow-y-auto"
    >
      {children}
    </Row>
  );
}
