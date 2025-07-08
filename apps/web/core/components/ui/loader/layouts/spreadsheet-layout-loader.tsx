import range from "lodash/range";
import { Row } from "@plane/ui";
import { getRandomLength } from "../utils";

export const SpreadsheetIssueRowLoader = (props: { columnCount: number }) => (
  <tr className="border-b border-custom-border-200 bg-custom-background-100">
    <td className="h-11 min-w-[28rem] z-[10] sticky left-0 flex items-center border-r-[0.5px] border-custom-border-200 bg-custom-background-100">
      <Row className="flex items-center gap-3">
        <span className="h-5 w-10 bg-custom-background-80 rounded animate-pulse" />
        <span
          className={`h-5 w-${getRandomLength(["32", "52", "72"])} bg-custom-background-80 rounded animate-pulse`}
        />
      </Row>
    </td>
    {range(props.columnCount).map((colIndex) => (
      <td key={colIndex} className="h-11 w-full min-w-[8rem] border-r border-custom-border-200 ">
        <div className="flex items-center justify-center gap-3 px-3">
          <span className="h-5 w-20 bg-custom-background-80 rounded animate-pulse" />
        </div>
      </td>
    ))}
  </tr>
);

export const SpreadsheetLayoutLoader = () => (
  <div className="horizontal-scroll-enable h-full w-full overflow-y-auto ">
    <table>
      <thead>
        <tr>
          <th className="h-11 min-w-[28rem] bg-custom-background-90 border-r border-custom-border-200 animate-pulse" />
          {range(10).map((index) => (
            <th
              key={index}
              className="h-11 w-full min-w-[8rem] bg-custom-background-90 border-r border-custom-border-200 animate-pulse"
            />
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
