import * as React from "react";

// icons
import { MoveLeft } from "lucide-react";

type BreadcrumbsProps = {
  onBack: () => void;
  children: any;
};

const Breadcrumbs = ({ onBack, children }: BreadcrumbsProps) => (
  <>
    <div className="flex w-full flex-grow items-center overflow-hidden overflow-ellipsis whitespace-nowrap">
      <button
        type="button"
        className="group grid h-7 w-7 flex-shrink-0 cursor-pointer place-items-center rounded border border-custom-sidebar-border-200 text-center text-sm hover:bg-custom-sidebar-background-90"
        onClick={onBack}
      >
        <MoveLeft className="h-4 w-4 text-custom-sidebar-text-200 group-hover:text-custom-sidebar-text-100" />
      </button>
      {children}
    </div>
  </>
);

type BreadcrumbItemProps = {
  title?: string;
  link?: JSX.Element;
  icon?: any;
  unshrinkTitle?: boolean;
};

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  title,
  link,
  icon,
  unshrinkTitle = false,
}) => (
  <>
    {link ? (
      link
    ) : (
      <div
        className={`truncate px-3 text-sm ${
          unshrinkTitle ? "flex-shrink-0" : ""
        }`}
      >
        <p className={`truncate ${icon ? "flex items-center gap-2" : ""}`}>
          {icon}
          <span className="break-words">{title}</span>
        </p>
      </div>
    )}
  </>
);

Breadcrumbs.BreadcrumbItem = BreadcrumbItem;

export { Breadcrumbs, BreadcrumbItem };
