"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Tooltip } from "@plane/ui";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  label?: string | ReactNode;
  href?: string;
  icon?: React.ReactNode | undefined;
  disableTooltip?: boolean;
};

export const BreadcrumbLink: React.FC<Props> = (props) => {
  const { href, label, icon, disableTooltip = false } = props;
  const { isMobile } = usePlatformOS();
  return (
    <Tooltip tooltipContent={label} position="bottom" isMobile={isMobile} disabled={disableTooltip}>
      <li className="flex items-center space-x-2" tabIndex={-1}>
        <div className="flex flex-wrap items-center gap-2.5">
          {href ? (
            <Link
              className="flex items-center gap-1 text-sm font-medium text-custom-text-300 hover:text-custom-text-100"
              href={href}
            >
              {icon && (
                <div className="flex h-5 w-5 items-center justify-center overflow-hidden !text-[1rem]">{icon}</div>
              )}
              {label && (
                <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">{label}</div>
              )}
            </Link>
          ) : (
            <div className="flex cursor-default items-center gap-1 text-sm font-medium text-custom-text-100">
              {icon && <div className="flex h-5 w-5 items-center justify-center overflow-hidden">{icon}</div>}
              <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">{label}</div>
            </div>
          )}
        </div>
      </li>
    </Tooltip>
  );
};
