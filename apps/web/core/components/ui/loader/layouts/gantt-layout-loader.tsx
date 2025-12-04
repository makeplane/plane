import { range } from "lodash-es";
import { Row } from "@plane/ui";
import { BLOCK_HEIGHT } from "@/components/gantt-chart/constants";
import { getRandomLength } from "../utils";

export function GanttLayoutListItemLoader() {
  return (
    <div className="flex w-full items-center gap-4 px-6 " style={{ height: `${BLOCK_HEIGHT}px` }}>
      <div className="px-3 h-6 w-8 bg-layer-1 rounded-sm" />
      <div className={`px-3 h-6 w-${getRandomLength(["32", "52", "72"])} bg-layer-1 rounded-sm`} />
    </div>
  );
}

export function GanttLayoutLoader() {
  return (
    <div className="flex flex-col h-full overflow-x-auto animate-pulse">
      <div className="min-h-10 w-full border-b border-subtle ">
        <span className="h-6 w-12 bg-layer-1 rounded-sm" />
      </div>
      <div className="flex h-full">
        <div className="h-full w-[25.5rem] border-r border-subtle">
          <Row className="flex items-end h-header py-2 border-b border-subtle">
            <div className="flex items-center justify-between w-full">
              <span className="h-5 w-14 bg-layer-1 rounded-sm" />
              <span className="h-5 w-16 bg-layer-1 rounded-sm" />
            </div>
          </Row>
          <Row className="flex flex-col gap-3 h-11 py-4 w-full">
            {range(6).map((index) => (
              <div key={index} className="flex items-center gap-3  h-11 w-full">
                <span className="h-6 w-6 bg-layer-1 rounded-sm" />
                <span className={`h-6 w-${getRandomLength(["32", "52", "72"])} bg-layer-1 rounded-sm`} />
              </div>
            ))}
          </Row>
        </div>
        <div className="h-full w-full border-r border-subtle">
          <div className="flex flex-col justify-between gap-2 h-header py-1.5 px-4 border-b border-subtle">
            <div className="flex items-center justify-start">
              <span className="h-5 w-20 bg-layer-1 rounded-sm" />
            </div>
            <div className="flex items-center gap-3 justify-between w-full">
              {range(15).map((index) => (
                <span key={index} className="h-5 w-10 bg-layer-1 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 h-11 p-4 w-full">
            {range(6).map((index) => (
              <div
                key={index}
                className={`flex items-center gap-3 h-11 w-full`}
                style={{ paddingLeft: getRandomLength(["115px", "208px", "260px"]) }}
              >
                <span className={`h-6 w-40 w-${getRandomLength(["32", "52", "72"])} bg-layer-1 rounded-sm`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
