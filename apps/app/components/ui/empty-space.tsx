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
  Icon?: any;
  link?: { text: string; href: string };
};

const EmptySpace: React.FC<EmptySpaceProps> = ({ title, description, children, Icon, link }) => (
  <>
    <div className="max-w-lg">
      {Icon ? (
        <div className="mb-4">
          <Icon className="h-14 w-14 text-gray-400" />
        </div>
      ) : null}

      <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      <div className="mt-1 text-sm text-gray-500">{description}</div>
      <ul role="list" className="mt-6 divide-y divide-gray-200 border-t border-b border-gray-200">
        {children}
      </ul>
      {link ? (
        <div className="mt-6 flex">
          <Link href={link.href}>
            <a className="text-sm font-medium text-theme hover:text-indigo-500">
              {link.text}
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </Link>
        </div>
      ) : null}
    </div>
  </>
);

type EmptySpaceItemProps = {
  title: string;
  description?: React.ReactNode | string;
  Icon: any;
  action: () => void;
};

const EmptySpaceItem: React.FC<EmptySpaceItemProps> = ({ title, description, Icon, action }) => (
  <>
    <li className="cursor-pointer" onClick={action}>
      <div
        className={`group relative flex ${
          description ? "items-start" : "items-center"
        } space-x-3 py-4`}
      >
        <div className="flex-shrink-0">
          <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-theme`}>
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-gray-900">{title}</div>
          {description ? <div className="text-sm text-gray-500">{description}</div> : null}
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

export { EmptySpace, EmptySpaceItem };
