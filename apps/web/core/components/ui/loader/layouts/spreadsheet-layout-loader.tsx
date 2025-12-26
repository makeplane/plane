import { range } from "lodash-es";
import { Row } from "@plane/ui";
import { getRandomLength } from "../utils";

export function SpreadsheetIssueRowLoader(props: { columnCount: number }) {
  return (
    <tr className="border-b border-subtle bg-surface-1">
      <td className="h-11 min-w-[28rem] z-[10] sticky left-0 flex items-center border-r-[0.5px] border-subtle bg-surface-1">
        <Row className="flex items-center gap-3">
          <span className="h-5 w-10 bg-layer-1 rounded-sm animate-pulse" />
          <span className={`h-5 w-${getRandomLength(["32", "52", "72"])} bg-layer-1 rounded-sm animate-pulse`} />
        </Row>
      </td>
      {range(props.columnCount).map((colIndex) => (
        <td key={colIndex} className="h-11 w-full min-w-[8rem] border-r border-subtle ">
          <div className="flex items-center justify-center gap-3 px-3">
            <span className="h-5 w-20 bg-layer-1 rounded-sm animate-pulse" />
          </div>
        </td>
      ))}
    </tr>
  );
}

export function SpreadsheetLayoutLoader() {
  return (
    <div className="horizontal-scroll-enable h-full w-full overflow-y-auto ">
      <table>
        <thead>
          <tr>
            <th className="h-11 min-w-[28rem] bg-surface-2 border-r border-subtle animate-pulse" />
            {range(10).map((index) => (
              <th key={index} className="h-11 w-full min-w-[8rem] bg-surface-2 border-r border-subtle animate-pulse" />
            ))}
          </tr>
        </thead>
        <tbody>
          {range(16).map((rowIndex) => (
            <SpreadsheetIssueRowLoader key={rowIndex} columnCount={10} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
