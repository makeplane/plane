import { range } from "lodash-es";
import { getRandomInt } from "../utils";

function CalendarDay() {
  const dataCount = getRandomInt(0, 1);
  const dataBlocks = range(dataCount).map((index) => (
    <span key={index} className="h-8 w-full bg-layer-1 rounded-sm mb-2" />
  ));

  return (
    <div className="flex w-full flex-col min-h-[9rem]">
      <div className="flex items-center justify-end p-2 w-full">
        <span className="h-6 w-6 bg-layer-1 rounded-sm" />
      </div>
      <div className="flex flex-col gap-2.5 p-2">{dataBlocks}</div>
    </div>
  );
}

export function CalendarLayoutLoader() {
  return (
    <div className="h-full w-full overflow-y-auto bg-surface-1 animate-pulse">
      <span className="relative grid divide-x-[0.5px] divide-subtle-1 text-13 font-medium grid-cols-5">
        {range(5).map((index) => (
          <span key={index} className="h-11 w-full bg-layer-1" />
        ))}
      </span>
      <div className="h-full w-full overflow-y-auto">
        <div className="grid h-full w-full grid-cols-1 divide-y-[0.5px] divide-subtle-1 overflow-y-auto">
          {range(6).map((index) => (
            <div key={index} className="grid divide-x-[0.5px] divide-subtle-1 grid-cols-5">
              {range(5).map((index) => (
                <CalendarDay key={index} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
