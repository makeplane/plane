import { Fragment, forwardRef } from "react";
import { range } from "lodash-es";
// plane ui
import { Row } from "@plane/ui";
// plane utils
import { cn } from "@plane/utils";
import { getRandomInt, getRandomLength } from "../utils";

export const ListLoaderItemRow = forwardRef(function ListLoaderItemRow(
  {
    shouldAnimate = true,
    renderForPlaceHolder = false,
    defaultPropertyCount = 6,
  }: { shouldAnimate?: boolean; renderForPlaceHolder?: boolean; defaultPropertyCount?: number },
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <Row
      ref={ref}
      className={cn("flex items-center justify-between h-11 py-3 ", {
        "bg-surface-1": renderForPlaceHolder,
        "border-b border-subtle": !renderForPlaceHolder,
      })}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn("h-5 w-10 bg-layer-1 rounded-sm", {
            "animate-pulse": shouldAnimate,
            "bg-surface-2": renderForPlaceHolder,
          })}
        />
        <span
          className={cn(`h-5 w-${getRandomLength(["32", "52", "72"])} bg-layer-1 rounded-sm`, {
            "animate-pulse": shouldAnimate,
            "bg-surface-2": renderForPlaceHolder,
          })}
        />
      </div>
      <div className="flex items-center gap-2">
        {range(defaultPropertyCount).map((index) => (
          <Fragment key={index}>
            {getRandomInt(1, 2) % 2 === 0 ? (
              <span
                key={index}
                className={cn("h-5 w-5 bg-layer-1 rounded-sm", {
                  "animate-pulse": shouldAnimate,
                  "bg-surface-2": renderForPlaceHolder,
                })}
              />
            ) : (
              <span
                className={cn("h-5 w-16 bg-layer-1 rounded-sm", {
                  "animate-pulse": shouldAnimate,
                  "bg-surface-2": renderForPlaceHolder,
                })}
              />
            )}
          </Fragment>
        ))}
      </div>
    </Row>
  );
});

ListLoaderItemRow.displayName = "ListLoaderItemRow";

function ListSection({ itemCount }: { itemCount: number }) {
  return (
    <div className="flex flex-shrink-0 flex-col">
      <Row className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-subtle bg-surface-2 py-1">
        <div className="flex items-center gap-2 py-1.5 w-full">
          <span className="h-6 w-6 bg-layer-1 rounded-sm animate-pulse" />
          <span className="h-6 w-24 bg-layer-1 rounded-sm animate-pulse" />
        </div>
      </Row>
      <div className="relative h-full w-full">
        {range(itemCount).map((index) => (
          <ListLoaderItemRow key={index} />
        ))}
      </div>
    </div>
  );
}

export function ListLayoutLoader() {
  return (
    <div className="flex flex-shrink-0 flex-col">
      {[6, 5, 2].map((itemCount, index) => (
        <ListSection key={index} itemCount={itemCount} />
      ))}
    </div>
  );
}
