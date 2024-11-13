import { Fragment, forwardRef } from "react";
import range from "lodash/range";
import { cn } from "@plane/editor";
import { Row } from "@plane/ui";
import { getRandomInt, getRandomLength } from "../utils";

export const ListLoaderItemRow = forwardRef<
  HTMLDivElement,
  { shouldAnimate?: boolean; renderForPlaceHolder?: boolean; defaultPropertyCount?: number }
>(({ shouldAnimate = true, renderForPlaceHolder = false, defaultPropertyCount = 6 }, ref) => (
  <Row
    ref={ref}
    className={cn("flex items-center justify-between h-11 py-3 ", {
      "bg-custom-background-100": renderForPlaceHolder,
      "border-b border-custom-border-200": !renderForPlaceHolder,
    })}
  >
    <div className="flex items-center gap-3">
      <span
        className={cn("h-5 w-10 bg-custom-background-80 rounded", {
          "animate-pulse": shouldAnimate,
          "bg-custom-background-90": renderForPlaceHolder,
        })}
      />
      <span
        className={cn(`h-5 w-${getRandomLength(["32", "52", "72"])} bg-custom-background-80 rounded`, {
          "animate-pulse": shouldAnimate,
          "bg-custom-background-90": renderForPlaceHolder,
        })}
      />
    </div>
    <div className="flex items-center gap-2">
      {range(defaultPropertyCount).map((index) => (
        <Fragment key={index}>
          {getRandomInt(1, 2) % 2 === 0 ? (
            <span
              key={index}
              className={cn("h-5 w-5 bg-custom-background-80 rounded", {
                "animate-pulse": shouldAnimate,
                "bg-custom-background-90": renderForPlaceHolder,
              })}
            />
          ) : (
            <span
              className={cn("h-5 w-16 bg-custom-background-80 rounded", {
                "animate-pulse": shouldAnimate,
                "bg-custom-background-90": renderForPlaceHolder,
              })}
            />
          )}
        </Fragment>
      ))}
    </div>
  </Row>
));

ListLoaderItemRow.displayName = "ListLoaderItemRow";

const ListSection = ({ itemCount }: { itemCount: number }) => (
  <div className="flex flex-shrink-0 flex-col">
    <Row className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 py-1">
      <div className="flex items-center gap-2 py-1.5 w-full">
        <span className="h-6 w-6 bg-custom-background-80 rounded animate-pulse" />
        <span className="h-6 w-24 bg-custom-background-80 rounded animate-pulse" />
      </div>
    </Row>
    <div className="relative h-full w-full">
      {range(itemCount).map((index) => (
        <ListLoaderItemRow key={index} />
      ))}
    </div>
  </div>
);

export const ListLayoutLoader = () => (
  <div className="flex flex-shrink-0 flex-col">
    {[6, 5, 2].map((itemCount, index) => (
      <ListSection key={index} itemCount={itemCount} />
    ))}
  </div>
);
