// next
import React from "react";
import Link from "next/link";
import { ChevronRightIcon } from "@plane/propel/icons";

type EmptySpaceProps = {
  title: string;
  description: string;
  children: any;
  Icon?: any;
  link?: { text: string; href: string };
};

function EmptySpace({ title, description, children, Icon, link }: EmptySpaceProps) {
  return (
    <>
      <div className="max-w-lg">
        {Icon ? (
          <div className="mb-4">
            <Icon className="h-14 w-14 text-secondary" />
          </div>
        ) : null}

        <h2 className="text-16 font-medium text-primary">{title}</h2>
        <div className="mt-1 text-13 text-secondary">{description}</div>
        <ul role="list" className="mt-6 divide-y divide-subtle-1 border-b border-t border-subtle">
          {children}
        </ul>
        {link ? (
          <div className="mt-6 flex">
            <Link href={link.href}>
              <span className="text-13 font-medium text-accent-primary hover:text-accent-primary">
                {link.text}
                <span aria-hidden="true"> &rarr;</span>
              </span>
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}

type EmptySpaceItemProps = {
  title: string;
  description?: React.ReactNode | string;
  Icon: any;
  action?: () => void;
  href?: string;
};

function EmptySpaceItem({ title, description, Icon, action, href }: EmptySpaceItemProps) {
  let spaceItem = (
    <div className={`group relative flex ${description ? "items-start" : "items-center"} space-x-3 py-4`}>
      <div className="flex-shrink-0">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent-primary">
          <Icon className="h-6 w-6 text-on-color" aria-hidden="true" />
        </span>
      </div>
      <div className="min-w-0 flex-1 text-secondary">
        <div className="text-13 font-medium group-hover:text-primary">{title}</div>
        {description ? <div className="text-13">{description}</div> : null}
      </div>
      <div className="flex-shrink-0 self-center">
        <ChevronRightIcon className="h-5 w-5 text-secondary group-hover:text-primary" aria-hidden="true" />
      </div>
    </div>
  );

  if (href) {
    spaceItem = <Link href={href}>{spaceItem}</Link>;
  }

  return (
    <>
      <li className="cursor-pointer" onClick={action} role="button">
        {spaceItem}
      </li>
    </>
  );
}

export { EmptySpace, EmptySpaceItem };
