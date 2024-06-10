import { getRandomInt } from "../utils";

const CalendarDay = () => {
  const dataCount = getRandomInt(0, 1);
  const dataBlocks = Array.from({ length: dataCount }, (_, index) => (
    <span key={index} className="h-8 w-full bg-custom-background-80 rounded mb-2" />
  ));

  return (
    <div className="flex w-full flex-col min-h-[9rem]">
      <div className="flex items-center justify-end p-2 w-full">
        <span className="h-6 w-6 bg-custom-background-80 rounded" />
      </div>
      <div className="flex flex-col gap-2.5 p-2">{dataBlocks}</div>
    </div>
  );
};

export const CalendarLayoutLoader = () => (
  <div className="h-full w-full overflow-y-auto bg-custom-background-100 pt-4 animate-pulse">
    <span className="relative grid divide-x-[0.5px] divide-custom-border-200 text-sm font-medium grid-cols-5">
      {[...Array(5)].map((_, index) => (
        <span key={index} className="h-11 w-full bg-custom-background-80" />
      ))}
    </span>
    <div className="h-full w-full overflow-y-auto">
      <div className="grid h-full w-full grid-cols-1 divide-y-[0.5px] divide-custom-border-200 overflow-y-auto">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="grid divide-x-[0.5px] divide-custom-border-200 grid-cols-5">
            {[...Array(5)].map((_, index) => (
              <CalendarDay key={index} />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);
