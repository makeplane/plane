// next
import Link from "next/link";
// react
import React from "react";
// icons
import { ChevronRightIcon } from "@heroicons/react/24/outline";

type EmptySpaceProps = {
  title: string;
  description: string;
  children: any;
  Icon?: (
    props: React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
      titleId?: string | undefined;
    }
  ) => JSX.Element;
  link?: { text: string; href: string };
};

const EmptySpace: React.FC<EmptySpaceProps> = ({ title, description, children, Icon, link }) => {
  return (
    <>
      <div className="max-w-lg">
        {Icon ? (
          <div className="mb-4">
            <Icon className="h-14 w-14 text-gray-400" />
          </div>
        ) : null}

        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">{description}</p>
        <ul role="list" className="mt-6 divide-y divide-gray-200 border-t border-b border-gray-200">
          {children}
        </ul>
        {link ? (
          <div className="mt-6 flex">
            <Link
              href={link.href}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {link.text}
              <span aria-hidden="true"> &rarr;</span>
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
};

type EmptySpaceItemProps = {
  title: string;
  description?: React.ReactNode | string;
  bgColor?: string;
  Icon: (
    props: React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
      titleId?: string | undefined;
    }
  ) => JSX.Element;
  action: () => void;
};

const EmptySpaceItem: React.FC<EmptySpaceItemProps> = ({
  title,
  description,
  bgColor = "blue",
  Icon,
  action,
}) => {
  return (
    <>
      <li className="cursor-pointer" onClick={action}>
        <div
          className={`group relative flex ${
            description ? "items-start" : "items-center"
          } space-x-3 py-4`}
        >
          <div className="flex-shrink-0">
            <span
              className={`inline-flex items-center justify-center h-10 w-10 rounded-lg bg-theme`}
            >
              <Icon className="h-6 w-6 text-white" aria-hidden="true" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900">{title}</div>
            {description ? <p className="text-sm text-gray-500">{description}</p> : null}
          </div>
          <div className="flex-shrink-0 self-center">
            <ChevronRightIcon
              className="h-5 w-5 text-gray-400 group-hover:text-gray-500"
              aria-hidden="true"
            />
          </div>
        </div>
      </li>
    </>
  );
};

export { EmptySpace, EmptySpaceItem };
