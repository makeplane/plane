// ui
import { CustomDatePicker } from "components/ui";
import { Tooltip } from "@plane/ui";
import { CalendarCheck } from "lucide-react";
// helpers
import { findHowManyDaysLeft, renderFormattedDate } from "helpers/date-time.helper";
// types
import { TIssue } from "@plane/types";

type Props = {
  issue: TIssue;
  onChange: (date: string | null) => void;
  handleOnOpen?: () => void;
  handleOnClose?: () => void;
  tooltipPosition?: "top" | "bottom";
  className?: string;
  noBorder?: boolean;
  disabled: boolean;
};

export const ViewDueDateSelect: React.FC<Props> = ({
  issue,
  onChange,
  handleOnOpen,
  handleOnClose,
  tooltipPosition = "top",
  className = "",
  noBorder = false,
  disabled,
}) => {
  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  return (
    <Tooltip
      tooltipHeading="Due date"
      tooltipContent={issue.target_date ? renderFormattedDate(issue.target_date) ?? "N/A" : "N/A"}
      position={tooltipPosition}
    >
      <div
        className={`group max-w-[6.5rem] flex-shrink-0 ${className} ${
          issue.target_date === null
            ? ""
            : issue.target_date < new Date().toISOString()
            ? "text-red-600"
            : findHowManyDaysLeft(issue.target_date) <= 3 && "text-orange-400"
        }`}
      >
        <CustomDatePicker
          value={issue?.target_date}
          onChange={onChange}
          className={`bg-transparent ${issue?.target_date ? "w-[6.5rem]" : "w-[5rem] text-center"}`}
          customInput={
            <div
              className={`flex items-center justify-center gap-2 rounded border border-custom-border-200 px-2 py-1 text-xs shadow-sm duration-200 hover:bg-custom-background-80 ${
                issue.target_date ? "pr-6 text-custom-text-300" : "text-custom-text-400"
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {issue.target_date ? (
                <>
                  <CalendarCheck className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{renderFormattedDate(issue.target_date) ?? "_ _"}</span>
                </>
              ) : (
                <>
                  <CalendarCheck className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Due Date</span>
                </>
              )}
            </div>
          }
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
