import { getRandomLength } from "../utils";

export const GanttLayoutLoader = () => (
  <div className="flex flex-col h-full overflow-x-auto animate-pulse">
    <div className="min-h-10 w-full border-b border-custom-border-200 ">
      <span className="h-6 w-12 bg-custom-background-80 rounded" />
    </div>
    <div className="flex h-full">
      <div className="h-full w-[25.5rem] border-r border-custom-border-200">
        <div className="flex items-end h-[3.75rem] py-2 px-4 border-b border-custom-border-200">
          <div className="flex items-center pl-6 justify-between w-full">
            <span className="h-5 w-14 bg-custom-background-80 rounded" />
            <span className="h-5 w-16 bg-custom-background-80 rounded" />
          </div>
        </div>
        <div className="flex flex-col gap-3 h-11 p-4 w-full">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex items-center gap-3  h-11 pl-6 w-full">
              <span className="h-6 w-6 bg-custom-background-80 rounded" />
              <span className={`h-6 w-${getRandomLength(["32", "52", "72"])} bg-custom-background-80 rounded`} />
            </div>
          ))}
        </div>
      </div>
      <div className="h-full w-full border-r border-custom-border-200">
        <div className="flex flex-col justify-between gap-2 h-[3.75rem] py-1.5 px-4 border-b border-custom-border-200">
          <div className="flex items-center justify-center">
            <span className="h-5 w-20 bg-custom-background-80 rounded" />
          </div>
          <div className="flex items-center gap-3 justify-between w-full">
            {[...Array(15)].map((_, index) => (
              <span key={index} className="h-5 w-10 bg-custom-background-80 rounded" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 h-11 p-4 w-full">
          {[...Array(6)].map((_, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 h-11 w-full`}
              style={{ paddingLeft: getRandomLength(["115px", "208px", "260px"]) }}
            >
              <span className={`h-6 w-40 w-${getRandomLength(["32", "52", "72"])} bg-custom-background-80 rounded`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
