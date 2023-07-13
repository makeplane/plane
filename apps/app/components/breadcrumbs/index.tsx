import * as React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// icons
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Icon } from "components/ui";

type BreadcrumbsProps = {
  children: any;
};

const Breadcrumbs = ({ children }: BreadcrumbsProps) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center">
        <button
          type="button"
          className="group grid h-7 w-7 flex-shrink-0 cursor-pointer place-items-center rounded border border-custom-sidebar-border-100 text-center text-sm hover:bg-custom-sidebar-background-90"
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
};

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ title, link, icon }) => (
  <>
    {link ? (
      <Link href={link}>
        <a className="border-r-2 border-custom-sidebar-border-100 px-3 text-sm">
          <p className={`${icon ? "flex items-center gap-2" : ""}`}>
            {icon ?? null}
            {title}
          </p>
        </a>
      </Link>
    ) : (
      <div className="max-w-64 px-3 text-sm">
        <p className={`${icon ? "flex items-center gap-2" : ""}`}>
          {icon}
          <span className="break-words">{title}</span>
        </p>
      </div>
    )}
  </>
);

Breadcrumbs.BreadcrumbItem = BreadcrumbItem;

export { Breadcrumbs, BreadcrumbItem };
