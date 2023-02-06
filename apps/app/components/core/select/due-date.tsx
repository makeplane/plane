// ui
import { CustomDatePicker } from "components/ui";
// helpers
import { findHowManyDaysLeft, renderShortNumericDateFormat } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  isNotAllowed: boolean;
};

export const DueDateSelect: React.FC<Props> = ({ issue, partialUpdateIssue, isNotAllowed }) => (
  <div
    className={`group relative ${
      issue.target_date === null
        ? ""
        : issue.target_date < new Date().toISOString()
        ? "text-red-600"
        : findHowManyDaysLeft(issue.target_date) <= 3 && "text-orange-400"
    }`}
  >
    <CustomDatePicker
      placeholder="N/A"
      value={issue?.target_date}
      onChange={(val) =>
        partialUpdateIssue({
          target_date: val,
        })
      }
      className={issue?.target_date ? "w-[6.5rem]" : "w-[3rem] text-center"}
    />
    <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
      <h5 className="mb-1 font-medium text-gray-900">Due date</h5>
      <div>{renderShortNumericDateFormat(issue.target_date ?? "")}</div>
      <div>
        {issue.target_date
          ? issue.target_date < new Date().toISOString()
            ? `Due date has passed by ${findHowManyDaysLeft(issue.target_date)} days`
            : findHowManyDaysLeft(issue.target_date) <= 3
            ? `Due date is in ${findHowManyDaysLeft(issue.target_date)} days`
            : "Due date"
          : "N/A"}
      </div>
    </div>
  </div>
);
