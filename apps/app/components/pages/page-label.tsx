import React from "react";

type TLabelProps = {
  variant: "red" | "blue" | string;
  children?: React.ReactNode;
};

const Label: React.FC<TLabelProps> = (props) => {
  let color = "bg-green-100 text-green-800";

  if (props.variant === "red") {
    color = "bg-red-100 text-red-800";
  } else if (props.variant === "blue") {
    color = "bg-blue-100 text-blue-800";
  }
  return (
    <p className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${color}`}>
      {props.children}
    </p>
  );
};

export default Label;
