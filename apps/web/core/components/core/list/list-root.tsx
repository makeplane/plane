import type { FC } from "react";
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
      className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg"
    >
      {children}
    </Row>
  );
}
