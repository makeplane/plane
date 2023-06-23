import { useRouter } from "next/router";

// ui
import { CustomDatePicker, Tooltip } from "components/ui";
// helpers
import { findHowManyDaysLeft } from "helpers/date-time.helper";
// services
import trackEventServices from "services/track-event.service";
// types
import { ICurrentUserResponse, IIssue } from "types";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issueId: string) => void;
  noBorder?: boolean;
  user: ICurrentUserResponse | undefined;
  isNotAllowed: boolean;
};

export const ViewDueDateSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  noBorder = false,
  user,
  isNotAllowed,
}) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <Tooltip tooltipHeading="Due Date" tooltipContent={issue.target_date ?? "N/A"}>
      <div
        className={`group relative max-w-[6.5rem] ${
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
                priority: issue.priority,
                state: issue.state,
              },
              issue.id
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
          className={issue?.target_date ? "w-[6.5rem]" : "w-[5rem] text-center"}
          noBorder={noBorder}
          disabled={isNotAllowed}
        />
      </div>
    </Tooltip>
  );
};
