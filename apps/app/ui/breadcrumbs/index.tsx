import { ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";

type BreadcrumbsProps = {
  children: any;
};

const Breadcrumbs = ({ children }: BreadcrumbsProps) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-center">
        <div
          className="border hover:bg-gray-100 rounded h-8 w-8 text-sm grid place-items-center text-center cursor-pointer"
          onClick={() => router.back()}
        >
          <ArrowLeftIcon className="h-3 w-3" />
        </div>
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

const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ title, link, icon }) => {
  return (
    <>
      {link ? (
        <Link href={link}>
          <a className="text-sm border-r-2 border-gray-300 px-3">
            <p className={`${icon ? "flex items-center gap-2" : ""}`}>
              {icon ?? null}
              {title}
            </p>
          </a>
        </Link>
      ) : (
        <div className="text-sm px-3">
          <p className={`${icon ? "flex items-center gap-2" : ""}`}>
            {icon}
            {title}
          </p>
        </div>
      )}
    </>
  );
};

Breadcrumbs.BreadcrumbItem = BreadcrumbItem;

export { Breadcrumbs, BreadcrumbItem };
