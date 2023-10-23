// ui
import { CustomDatePicker } from "components/ui";
import { Tooltip } from "@plane/ui";
// helpers
import { findHowManyDaysLeft, renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  onChange: (date: string | null) => void;
  handleOnOpen?: () => void;
  handleOnClose?: () => void;
  tooltipPosition?: "top" | "bottom";
  noBorder?: boolean;
  disabled: boolean;
};

export const ViewDueDateSelect: React.FC<Props> = ({
  issue,
  onChange,
  handleOnOpen,
  handleOnClose,
  tooltipPosition = "top",
  noBorder = false,
  disabled,
}) => {
  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  return (
    <Tooltip
      tooltipHeading="Due date"
      tooltipContent={issue.target_date ? renderShortDateWithYearFormat(issue.target_date) ?? "N/A" : "N/A"}
      position={tooltipPosition}
    >
      <div
        className={`group flex-shrink-0 relative max-w-[6.5rem] ${
          issue.target_date === null
            ? ""
            : issue.target_date < new Date().toISOString()
            ? "text-red-600"
            : findHowManyDaysLeft(issue.target_date) <= 3 && "text-orange-400"
        }`}
      >
        <CustomDatePicker
          placeholder="Due date"
          value={issue?.target_date}
          onChange={onChange}
          className={`bg-transparent ${issue?.target_date ? "w-[6.5rem]" : "w-[5rem] text-center"}`}
          minDate={minDate ?? undefined}
          noBorder={noBorder}
          handleOnOpen={handleOnOpen}
          handleOnClose={handleOnClose}
          disabled={disabled}
        />
      </div>
    </Tooltip>
  );
};
