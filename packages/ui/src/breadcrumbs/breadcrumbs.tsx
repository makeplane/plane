import * as React from "react";
import { ChevronRight } from "lucide-react";

type BreadcrumbsProps = {
  children: React.ReactNode;
  onBack?: () => void;
  isLoading?: boolean;
};

const Breadcrumbs = ({ children, onBack, isLoading = false }: BreadcrumbsProps) => {
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

  const BreadcrumbItemLoader = (
    <div className="flex items-center gap-1 animate-pulse">
      <span className="h-5 w-5 bg-custom-background-80 rounded" />
      <span className="h-5 w-16 bg-custom-background-80 rounded" />
    </div>
  );

  return (
    <div className="flex items-center space-x-2 overflow-hidden">
      {!isSmallScreen && (
        <>
          {childrenArray.map((child, index) => (
            <React.Fragment key={index}>
              {index > 0 && !isSmallScreen && (
                <div className="flex items-center gap-2.5">
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-400" aria-hidden="true" />
                </div>
              )}
              <div className={`flex items-center gap-2.5 ${isSmallScreen && index > 0 ? "hidden sm:flex" : "flex"}`}>
                {isLoading ? BreadcrumbItemLoader : child}
              </div>
            </React.Fragment>
          ))}
        </>
      )}

      {isSmallScreen && childrenArray.length > 1 && (
        <>
          <div className="flex items-center gap-2.5">
            {onBack && (
              <span onClick={onBack} className="text-custom-text-200">
                ...
              </span>
            )}
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-400" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2.5">
            {isLoading ? BreadcrumbItemLoader : childrenArray[childrenArray.length - 1]}
          </div>
        </>
      )}
      {isSmallScreen && childrenArray.length === 1 && childrenArray}
    </div>
  );
};

type Props = {
  type?: "text" | "component";
  component?: React.ReactNode;
  link?: JSX.Element;
};

const BreadcrumbItem: React.FC<Props> = (props) => {
  const { type = "text", component, link } = props;
  return <>{type !== "text" ? <div className="flex items-center space-x-2">{component}</div> : link}</>;
};

Breadcrumbs.BreadcrumbItem = BreadcrumbItem;

export { Breadcrumbs, BreadcrumbItem };
