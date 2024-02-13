import { getRandomLength } from "../utils";

export const SpreadsheetLayoutLoader = () => (
  <div className="horizontal-scroll-enable h-full w-full animate-pulse">
    <table>
      <thead>
        <tr>
          <th className="h-11 min-w-[28rem] bg-custom-background-90 border-r border-custom-border-100" />
          {[...Array(10)].map((_, index) => (
            <th
              key={index}
              className="h-11 w-full min-w-[8rem] bg-custom-background-90 border-r border-custom-border-100"
            />
          ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(16)].map((_, rowIndex) => (
          <tr key={rowIndex} className="border-b border-custom-border-100">
            <td className="h-11 min-w-[28rem] border-r border-custom-border-100">
              <div className="flex items-center gap-3 px-3">
                <span className="h-5 w-10 bg-custom-background-80 rounded" />
                <span className={`h-5 w-${getRandomLength(["32", "52", "72"])} bg-custom-background-80 rounded`} />
              </div>
            </td>
            {[...Array(10)].map((_, colIndex) => (
              <td key={colIndex} className="h-11 w-full min-w-[8rem] border-r border-custom-border-100">
                <div className="flex items-center justify-center gap-3 px-3">
                  <span className="h-5 w-20 bg-custom-background-80 rounded" />
                </div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
