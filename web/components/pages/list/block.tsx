import { FC } from "react";
import Link from "next/link";
import { Circle, Info, Star, UsersRound } from "lucide-react";
// components
import { PageQuickActions } from "components/pages";
import { Tooltip } from "@plane/ui";

type TPageListBlock = {
  pageId: string;
};

export const PageListBlock: FC<TPageListBlock> = (props) => {
  const { pageId } = props;

  return (
    <Link href="/" className="flex items-center justify-between gap-5 py-7 px-6 hover:bg-custom-background-90">
      {/* page title */}
      <Tooltip tooltipContent="Title">
        <h5 className="text-base font-semibold flex-grow truncate">Page title</h5>
      </Tooltip>
      {/* page properties */}
      <div className="flex items-center gap-5 flex-shrink-0">
        {/* duration & privacy */}
        <div className="flex items-center gap-2 text-custom-text-400">
          <span className="text-xs">10m read</span>
          <Circle className="h-1 w-1 fill-custom-text-300" />
          {/* <Lock className="h-3 w-3" /> */}
          <UsersRound className="h-3 w-3" />
        </div>
        {/* page info */}
        <button
          type="button"
          className="h-4 w-4 grid place-items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Info className="h-4 w-4 text-custom-text-300" />
        </button>
        {/* favorite/unfavorite */}
        <button
          type="button"
          className="h-4 w-4 grid place-items-center"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Star className="h-4 w-4 text-custom-text-300" />
        </button>
        {/* quick actions dropdown */}
        <PageQuickActions pageId={pageId} />
      </div>
    </Link>
  );
};
