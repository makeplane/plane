import { ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useRouter } from "next/router";

type BreadcrumbsProps = {
  children: any;
};

const Breadcrumbs = (props: BreadcrumbsProps) => {
  const router = useRouter();

  return (
    <>
      <div className="flex gap-3 ml-1">
        <div
          className="bg-indigo-50 hover:bg-indigo-100 duration-300 px-3 py-1 rounded-tl-lg rounded-tr-md rounded-br-lg rounded-bl-md skew-x-[-20deg] text-sm text-center grid place-items-center cursor-pointer"
          onClick={() => router.back()}
        >
          <p className="skew-x-[20deg]">
            <ArrowLeftIcon className="h-3 w-3" />
          </p>
        </div>
        {props.children}
      </div>
    </>
  );
};

type BreadcrumbItemProps = {
  title: string;
  link?: string;
  icon?: any;
};

const BreadcrumbItem = (props: BreadcrumbItemProps) => {
  return (
    <>
      {props.link ? (
        <Link href={props.link}>
          <a className="bg-indigo-50 hover:bg-indigo-100 duration-300 px-4 py-1 rounded-tl-lg rounded-tr-md rounded-br-lg rounded-bl-md skew-x-[-20deg] text-sm text-center">
            <p className={`skew-x-[20deg] ${props.icon ? "flex items-center gap-2" : ""}`}>
              {props?.icon}
              {props.title}
            </p>
          </a>
        </Link>
      ) : (
        <div className="bg-indigo-50 px-4 py-1 rounded-tl-lg rounded-tr-md rounded-br-lg rounded-bl-md skew-x-[-20deg] text-sm text-center">
          <p className={`skew-x-[20deg] ${props.icon ? "flex items-center gap-2" : ""}`}>
            {props?.icon}
            {props.title}
          </p>
        </div>
      )}
    </>
  );
};

export { Breadcrumbs, BreadcrumbItem };
