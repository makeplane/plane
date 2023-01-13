import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

const Loader = ({ children, className = "" }: Props) => {
  return (
    <div className={`${className} animate-pulse`} role="status">
      {children}
    </div>
  );
};

type ItemProps = {
  height?: string;
  width?: string;
  light?: boolean;
};

const Item: React.FC<ItemProps> = ({ height = "auto", width = "auto", light }) => {
  return (
    <div
      className={`rounded-md ${light ? "bg-gray-200" : "bg-gray-300"}`}
      style={{ height: height, width: width }}
    ></div>
  );
};

Loader.Item = Item;

export default Loader;
