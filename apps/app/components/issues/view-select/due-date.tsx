import { useRouter } from "next/router";

// ui
import { CustomDatePicker, Tooltip } from "components/ui";
// helpers
import { findHowManyDaysLeft, renderShortDateWithYearFormat } from "helpers/date-time.helper";
// services
import trackEventServices from "services/track-event.service";
// types
import { ICurrentUserResponse, IIssue } from "types";
import useIssuesView from "hooks/use-issues-view";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  tooltipPosition?: "top" | "bottom";
  noBorder?: boolean;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const ViewDueDateSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  tooltipPosition = "top",
  noBorder = false,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { issueView } = useIssuesView();

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  return (
    <Tooltip
      tooltipHeading="Due date"
      tooltipContent={
        issue.target_date ? renderShortDateWithYearFormat(issue.target_date) ?? "N/A" : "N/A"
      }
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
          onChange={(val) => {
            partialUpdateIssue(
              {
                target_date: val,
              },
              issue
            );
            trackEventServices.trackIssuePartialPropertyUpdateEvent(
              {
                workspaceSlug,
                workspaceId: issue.workspace,
                projectId: issue.project_detail.id,
                projectIdentifier: issue.project_detail.identifier,
                projectName: issue.project_detail.name,
                issueId: issue.id,
              },
              "ISSUE_PROPERTY_UPDATE_DUE_DATE",
              user
            );
          }}
          className={`${issue?.target_date ? "w-[6.5rem]" : "w-[5rem] text-center"} ${
            issueView === "kanban" ? "bg-custom-background-90" : "bg-custom-background-100"
          }`}
          minDate={minDate ?? undefined}
          noBorder={noBorder}
          disabled={isNotAllowed}
        />
      </div>
    </Tooltip>
  );
};
