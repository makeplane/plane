import React from "react";
// helpers
import { cn } from "../utils/classname";

type Props = {
  children: React.ReactNode;
  className?: string;
};

const Skeleton = ({ children, className = "" }: Props) => (
  <div data-slot="skeleton" className={cn("animate-pulse", className)} role="status">
    {children}
  </div>
);

type ItemProps = {
  height?: string;
  width?: string;
  className?: string;
};

const Item: React.FC<ItemProps> = ({ height = "auto", width = "auto", className = "" }) => (
  <div
    data-slot="skeleton-item"
    className={cn("rounded-md bg-custom-background-80", className)}
    style={{ height: height, width: width }}
  />
);

Skeleton.Item = Item;

Skeleton.displayName = "plane-ui-skeleton";

export { Skeleton };
