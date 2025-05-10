import React from "react";
// plane package imports
import { cn } from "@plane/utils";

type Props = {
  title: string;
  children: React.ReactNode;
  className?: string;
};

const AnalyticsWrapper: React.FC<Props> = (props) => {
  const { title, children, className } = props;

  return (
    <div className={cn("px-6 py-4", className)}>
      <h1 className={"mb-4 text-2xl font-bold md:mb-6"}>{title}</h1>
      {children}
    </div>
  );
};

export default AnalyticsWrapper;
