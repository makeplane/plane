import * as React from "react";

// icons
import { ChevronRight } from "lucide-react";

type BreadcrumbsProps = {
  children: any;
};

const Breadcrumbs = ({ children }: BreadcrumbsProps) => (
  <div className="flex items-center space-x-2">
    {React.Children.map(children, (child, index) => (
      <div key={index} className="flex flex-wrap items-center gap-2.5">
        {child}
        {index !== React.Children.count(children) - 1 && (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-400" aria-hidden="true" />
        )}
      </div>
    ))}
  </div>
);

type Props = {
  type?: "text" | "component";
  component?: React.ReactNode;
  link?: JSX.Element;
};
const BreadcrumbItem: React.FC<Props> = (props) => {
  const { type = "text", component, link } = props;
  return <>{type != "text" ? <div className="flex items-center space-x-2">{component}</div> : link}</>;
};

Breadcrumbs.BreadcrumbItem = BreadcrumbItem;

export { Breadcrumbs, BreadcrumbItem };
