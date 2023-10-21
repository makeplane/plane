import { FC } from "react";
import { useRouter } from "next/router";
// ui
import { CustomDatePicker } from "components/ui";
import { Tooltip } from "@plane/ui";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// services
import { TrackEventService } from "services/track_event.service";
// types
import { IUser, IIssue } from "types";
import useIssuesView from "hooks/use-issues-view";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  handleOnOpen?: () => void;
  handleOnClose?: () => void;
  tooltipPosition?: "top" | "bottom";
  noBorder?: boolean;
  user: IUser | undefined;
  isNotAllowed: boolean;
};

const trackEventService = new TrackEventService();

export const ViewStartDateSelect: FC<Props> = ({
  issue,
  partialUpdateIssue,
  handleOnOpen,
  handleOnClose,
  tooltipPosition = "top",
  noBorder = false,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { displayFilters } = useIssuesView();

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
          onChange={(val) => {
            partialUpdateIssue(
              {
                start_date: val,
              },
              issue
            );
            trackEventService.trackIssuePartialPropertyUpdateEvent(
              {
                workspaceSlug,
                workspaceId: issue.workspace,
                projectId: issue.project_detail.id,
                projectIdentifier: issue.project_detail.identifier,
                projectName: issue.project_detail.name,
                issueId: issue.id,
              },
              "ISSUE_PROPERTY_UPDATE_DUE_DATE",
              user as IUser
            );
          }}
          className={`${issue?.start_date ? "w-[6.5rem]" : "w-[5rem] text-center"} ${
            displayFilters.layout === "kanban" ? "bg-custom-background-90" : "bg-custom-background-100"
          }`}
          maxDate={maxDate ?? undefined}
          noBorder={noBorder}
          handleOnOpen={handleOnOpen}
          handleOnClose={handleOnClose}
          disabled={isNotAllowed}
        />
      </div>
    </Tooltip>
  );
};
