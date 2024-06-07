import { Fragment } from "react";
import { getRandomInt, getRandomLength } from "../utils";

const ListItemRow = () => (
  <div className="flex items-center justify-between h-11 p-3 border-b border-custom-border-200">
    <div className="flex items-center gap-3">
      <span className="h-5 w-10 bg-custom-background-80 rounded" />
      <span className={`h-5 w-${getRandomLength(["32", "52", "72"])} bg-custom-background-80 rounded`} />
    </div>
    <div className="flex items-center gap-2">
      {[...Array(6)].map((_, index) => (
        <Fragment key={index}>
          {getRandomInt(1, 2) % 2 === 0 ? (
            <span key={index} className="h-5 w-5 bg-custom-background-80 rounded" />
          ) : (
            <span className="h-5 w-16 bg-custom-background-80 rounded" />
          )}
        </Fragment>
      ))}
    </div>
  </div>
);

const ListSection = ({ itemCount }: { itemCount: number }) => (
  <div className="flex flex-shrink-0 flex-col">
    <div className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 px-3 py-1">
      <div className="flex items-center gap-2 py-1.5 w-full">
        <span className="h-6 w-6 bg-custom-background-80 rounded" />
        <span className="h-6 w-24 bg-custom-background-80 rounded" />
      </div>
    </div>
    <div className="relative h-full w-full">
      {[...Array(itemCount)].map((_, index) => (
        <ListItemRow key={index} />
      ))}
    </div>
  </div>
);

export const ListLayoutLoader = () => (
  <div className="flex flex-shrink-0 flex-col animate-pulse">
    {[6, 5, 2].map((itemCount, index) => (
      <ListSection key={index} itemCount={itemCount} />
    ))}
  </div>
);
