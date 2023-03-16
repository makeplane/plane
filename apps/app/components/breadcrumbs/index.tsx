import * as React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
// icons
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

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
          className="grid h-8 w-8 flex-shrink-0 cursor-pointer place-items-center rounded border border-gray-300 text-center text-sm hover:bg-gray-100"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="h-3 w-3" />
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
        <a className="border-r-2 border-gray-300 px-3 text-sm">
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
          <span className="break-all">{title}</span>
        </p>
      </div>
    )}
  </>
);

Breadcrumbs.BreadcrumbItem = BreadcrumbItem;

export { Breadcrumbs, BreadcrumbItem };
