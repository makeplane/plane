import * as React from "react";

// icons
import { ChevronRight } from "lucide-react";
// components
import { Tooltip } from "../tooltip";

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
  label?: string;
  icon?: React.ReactNode;
  link?: string;
};
const BreadcrumbItem: React.FC<Props> = (props) => {
  const { type = "text", component, label, icon, link } = props;
  return (
    <>
      {type != "text" ? (
        <div className="flex items-center space-x-2">{component}</div>
      ) : (
        <Tooltip tooltipContent={label} position="bottom">
          <li className="flex items-center space-x-2">
            <div className="flex flex-wrap items-center gap-2.5">
              {link ? (
                <a
                  className="flex items-center gap-1 text-sm font-medium text-custom-text-300 hover:text-custom-text-100"
                  href={link}
                >
                  {icon && (
                    <div className="flex h-5 w-5 items-center justify-center overflow-hidden !text-[1rem]">{icon}</div>
                  )}
                  <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">{label}</div>
                </a>
              ) : (
                <div className="flex cursor-default items-center gap-1 text-sm font-medium text-custom-text-100">
                  {icon && <div className="flex h-5 w-5 items-center justify-center overflow-hidden">{icon}</div>}
                  <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">{label}</div>
                </div>
              )}
            </div>
          </li>
        </Tooltip>
      )}
    </>
  );
};

Breadcrumbs.BreadcrumbItem = BreadcrumbItem;

export { Breadcrumbs, BreadcrumbItem };
