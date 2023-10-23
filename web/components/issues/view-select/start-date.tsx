// ui
import { CustomDatePicker } from "components/ui";
import { Tooltip } from "@plane/ui";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
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

export const ViewStartDateSelect: React.FC<Props> = ({
  issue,
  onChange,
  handleOnOpen,
  handleOnClose,
  tooltipPosition = "top",
  noBorder = false,
  disabled,
}) => {
  const maxDate = issue.target_date ? new Date(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <Tooltip
      tooltipHeading="Start date"
      tooltipContent={issue.start_date ? renderShortDateWithYearFormat(issue.start_date) ?? "N/A" : "N/A"}
      position={tooltipPosition}
    >
      <div className="group flex-shrink-0 relative max-w-[6.5rem]">
        <CustomDatePicker
          placeholder="Start date"
          value={issue?.start_date}
          onChange={onChange}
          className={`bg-transparent ${issue?.start_date ? "w-[6.5rem]" : "w-[5rem] text-center"}`}
          maxDate={maxDate ?? undefined}
          noBorder={noBorder}
          handleOnOpen={handleOnOpen}
          handleOnClose={handleOnClose}
          disabled={disabled}
        />
      </div>
    </Tooltip>
  );
};
