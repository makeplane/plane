import { ChevronRight } from "lucide-react";
import * as React from "react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "../utils";

type BreadcrumbsProps = {
  className?: string;
  children: React.ReactNode;
  onBack?: () => void;
  isLoading?: boolean;
};

export const BreadcrumbItemLoader = () => (
  <div className="flex items-center gap-2 h-7 animate-pulse">
    <div className="group h-full flex items-center gap-2 rounded px-2 py-1 text-sm font-medium">
      <span className="h-full w-5 bg-custom-background-80 rounded" />
      <span className="h-full w-16 bg-custom-background-80 rounded" />
    </div>
  </div>
);

const Breadcrumbs = ({ className, children, onBack, isLoading = false }: BreadcrumbsProps) => {
  const [isSmallScreen, setIsSmallScreen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth <= 640); // Adjust this value as per your requirement
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Call it initially to set the correct state
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const childrenArray = React.Children.toArray(children);

  return (
    <div className={cn("flex items-center overflow-hidden gap-0.5 flex-grow", className)}>
      {!isSmallScreen && (
        <>
          {childrenArray.map((child, index) => {
            if (isLoading) {
              return (
                <>
                  <BreadcrumbItemLoader />
                </>
              );
            }
            if (React.isValidElement<BreadcrumbItemProps>(child)) {
              return React.cloneElement(child, {
                isLast: index === childrenArray.length - 1,
              });
            }
            return child;
          })}
        </>
      )}

      {isSmallScreen && childrenArray.length > 1 && (
        <>
          <div className="flex items-center gap-2.5 p-1">
            {onBack && (
              <span onClick={onBack} className="text-custom-text-200">
                ...
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-400" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2.5 p-1">
            {isLoading ? (
              <BreadcrumbItemLoader />
            ) : React.isValidElement(childrenArray[childrenArray.length - 1]) ? (
              React.cloneElement(childrenArray[childrenArray.length - 1] as React.ReactElement, {
                isLast: true,
              })
            ) : (
              childrenArray[childrenArray.length - 1]
            )}
          </div>
        </>
      )}
      {isSmallScreen && childrenArray.length === 1 && childrenArray}
    </div>
  );
};

// breadcrumb item
type BreadcrumbItemProps = {
  component?: React.ReactNode;
  showSeparator?: boolean;
  isLast?: boolean;
};

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = (props) => {
  const { component, showSeparator = true, isLast = false } = props;
  return (
    <div className="flex items-center gap-0.5 h-6">
      {component}
      {showSeparator && !isLast && <BreadcrumbSeparator />}
    </div>
  );
};

// breadcrumb icon
type BreadcrumbIconProps = {
  children: React.ReactNode;
  className?: string;
};

const BreadcrumbIcon: React.FC<BreadcrumbIconProps> = (props) => {
  const { children, className } = props;
  return <div className={cn("flex size-4 items-center justify-start overflow-hidden", className)}>{children}</div>;
};

// breadcrumb label
type BreadcrumbLabelProps = {
  children: React.ReactNode;
  className?: string;
};

const BreadcrumbLabel: React.FC<BreadcrumbLabelProps> = (props) => {
  const { children, className } = props;
  return (
    <div className={cn("relative line-clamp-1 block max-w-[150px] overflow-hidden truncate", className)}>
      {children}
    </div>
  );
};

// breadcrumb separator
type BreadcrumbSeparatorProps = {
  className?: string;
  containerClassName?: string;
  iconClassName?: string;
  showDivider?: boolean;
};

const BreadcrumbSeparator: React.FC<BreadcrumbSeparatorProps> = (props) => {
  const { className, containerClassName, iconClassName, showDivider = false } = props;
  return (
    <div className={cn("relative flex items-center justify-center h-full px-1.5 py-1", className)}>
      {showDivider && <span className="absolute -left-0.5 top-0 h-full w-[1.8px] bg-custom-background-100" />}
      <div
        className={cn(
          "flex items-center justify-center flex-shrink-0 rounded text-custom-text-400 transition-all",
          containerClassName
        )}
      >
        <ChevronRight className={cn("h-3.5 w-3.5 flex-shrink-0", iconClassName)} />
      </div>
    </div>
  );
};

// breadcrumb wrapper
type BreadcrumbItemWrapperProps = {
  label?: string;
  disableTooltip?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: "link" | "text";
  isLast?: boolean;
};

const BreadcrumbItemWrapper: React.FC<BreadcrumbItemWrapperProps> = (props) => {
  const { label, disableTooltip = false, children, className, type = "link", isLast = false } = props;
  return (
    <Tooltip tooltipContent={label} position="bottom" disabled={!label || label === "" || disableTooltip}>
      <div
        className={cn(
          "group h-full flex items-center gap-2 rounded px-1.5 py-1 text-sm font-medium text-custom-text-300 cursor-default",
          {
            "hover:text-custom-text-100 hover:bg-custom-background-90 cursor-pointer": type === "link" && !isLast,
          },
          className
        )}
      >
        {children}
      </div>
    </Tooltip>
  );
};

Breadcrumbs.Item = BreadcrumbItem;
Breadcrumbs.Icon = BreadcrumbIcon;
Breadcrumbs.Label = BreadcrumbLabel;
Breadcrumbs.Separator = BreadcrumbSeparator;
Breadcrumbs.ItemWrapper = BreadcrumbItemWrapper;

export { Breadcrumbs, BreadcrumbItem, BreadcrumbIcon, BreadcrumbLabel, BreadcrumbSeparator, BreadcrumbItemWrapper };
