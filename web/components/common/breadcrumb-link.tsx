import { Tooltip } from "@plane/ui";
import Link from "next/link";

type Props = {
  label?: string;
  href?: string;
  icon?: React.ReactNode | undefined;
};

export const BreadcrumbLink: React.FC<Props> = (props) => {
  const { href, label, icon } = props;
  return (
    <Tooltip tooltipContent={label} position="bottom">
      <li className="flex items-center space-x-2" tabIndex={-1}>
        <div className="flex flex-wrap items-center gap-2.5">
          {href ? (
            <Link
              className="flex items-center gap-1 text-sm font-medium text-neutral-text-medium hover:text-neutral-text-strong"
              href={href}
            >
              {icon && (
                <div className="flex h-5 w-5 items-center justify-center overflow-hidden !text-[1rem]">{icon}</div>
              )}
              <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">{label}</div>
            </Link>
          ) : (
            <div className="flex cursor-default items-center gap-1 text-sm font-medium text-neutral-text-strong">
              {icon && <div className="flex h-5 w-5 items-center justify-center overflow-hidden">{icon}</div>}
              <div className="relative line-clamp-1 block max-w-[150px] overflow-hidden truncate">{label}</div>
            </div>
          )}
        </div>
      </li>
    </Tooltip>
  );
};
