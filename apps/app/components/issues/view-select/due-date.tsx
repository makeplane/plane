// ui
import { CustomDatePicker, Tooltip } from "components/ui";
// helpers
import { findHowManyDaysLeft } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>) => void;
  isNotAllowed: boolean;
};

export const ViewDueDateSelect: React.FC<Props> = ({ issue, partialUpdateIssue, isNotAllowed }) => (
  <Tooltip tooltipHeading="Due Date" tooltipContent={issue.target_date ?? "N/A"}>
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
        disabled={isNotAllowed}
      />
    </div>
  </Tooltip>
);
