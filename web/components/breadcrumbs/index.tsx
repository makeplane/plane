import * as React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// icons
import { Icon } from "components/ui";

type BreadcrumbsProps = {
  children: any;
};

const Breadcrumbs = ({ children }: BreadcrumbsProps) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center flex-grow w-full whitespace-nowrap overflow-hidden overflow-ellipsis">
        <button
          type="button"
          className="group grid h-7 w-7 flex-shrink-0 cursor-pointer place-items-center rounded border border-custom-sidebar-border-200 text-center text-sm hover:bg-custom-sidebar-background-90"
          onClick={() => router.back()}
        >
          <Icon
            iconName="keyboard_backspace"
            className="text-base leading-4 text-custom-sidebar-text-200 group-hover:text-custom-sidebar-text-100"
          />
        </button>
        {children}
      </div>
    </>
  );
};

type BreadcrumbItemProps = {
  title: string;
  link?: string;
  icon?: any;
  linkTruncate?: boolean;
  unshrinkTitle?: boolean;
};

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({
  title,
  link,
  icon,
  linkTruncate = false,
  unshrinkTitle = false,
}) => (
  <>
    {link ? (
      <Link href={link}>
        <a
          className={`border-r-2 border-custom-sidebar-border-200 px-3 text-sm ${
            linkTruncate ? "truncate" : ""
          }`}
        >
          <p
            className={`${linkTruncate ? "truncate" : ""}${icon ? "flex items-center gap-2" : ""}`}
          >
            {icon ?? null}
            {title}
          </p>
        </a>
      </Link>
    ) : (
      <div className={`px-3 text-sm truncate ${unshrinkTitle ? "flex-shrink-0" : ""}`}>
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
