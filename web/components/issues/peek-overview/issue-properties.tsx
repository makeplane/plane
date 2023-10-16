import { FC } from "react";
// components
import { StateGroupIcon } from "components/icons";
// hooks
import useToast from "hooks/use-toast";
// components
import {
  SidebarAssigneeSelect,
  SidebarPrioritySelect,
  SidebarStateSelect,
  TPeekOverviewModes,
} from "components/issues";
// ui
import { CustomDatePicker, Icon } from "components/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IIssue } from "types";

type Props = {
  handleDeleteIssue: () => void;
  handleUpdateIssue: (formData: Partial<IIssue>) => Promise<void>;
  issue: IIssue;
  mode: TPeekOverviewModes;
  readOnly: boolean;
  workspaceSlug: string;
};

export const PeekOverviewIssueProperties: FC<Props> = (props) => {
  const { handleDeleteIssue, handleUpdateIssue, issue, mode, readOnly } = props;
  // toast
  const { setToastAlert } = useToast();

  const startDate = issue.start_date;
  const targetDate = issue.target_date;

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToastAlert({
        type: "success",
        title: "Link copied!",
        message: "Issue link copied to clipboard",
      });
    });
  };

  return (
    <div className={mode === "full" ? "divide-y divide-custom-border-200" : ""}>
      {mode === "full" && (
        <div className="flex justify-between gap-2 pb-3">
          <h6 className="flex items-center gap-2 font-medium">
            <StateGroupIcon stateGroup={issue.state_detail.group} color={issue.state_detail.color} />
            {issue.project_detail.identifier}-{issue.sequence_id}
          </h6>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleCopyLink} className="-rotate-45">
              <Icon iconName="link" />
            </button>
            <button type="button" onClick={handleDeleteIssue}>
              <Icon iconName="delete" />
            </button>
          </div>
        </div>
      )}
      <div className={`space-y-4 ${mode === "full" ? "pt-3" : ""}`}>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="radio_button_checked" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">State</span>
          </div>
          <div className="w-3/4">
            <SidebarStateSelect
              value={issue.state}
              onChange={(val: string) => handleUpdateIssue({ state: val })}
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="group" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Assignees</span>
          </div>
          <div className="w-3/4">
            <SidebarAssigneeSelect
              value={issue.assignees}
              onChange={(val: string[]) => handleUpdateIssue({ assignees_list: val })}
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="signal_cellular_alt" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Priority</span>
          </div>
          <div className="w-3/4">
            <SidebarPrioritySelect
              value={issue.priority}
              onChange={(val) => handleUpdateIssue({ priority: val })}
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="calendar_today" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Start date</span>
          </div>
          <div>
            <CustomDatePicker
              placeholder="Select start date"
              value={issue.start_date}
              onChange={(val) =>
                handleUpdateIssue({
                  start_date: val,
                })
              }
              className="bg-custom-background-80 border-none"
              maxDate={maxDate ?? undefined}
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="calendar_today" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Due date</span>
          </div>
          <div>
            <CustomDatePicker
              placeholder="Select due date"
              value={issue.target_date}
              onChange={(val) =>
                handleUpdateIssue({
                  target_date: val,
                })
              }
              className="bg-custom-background-80 border-none"
              minDate={minDate ?? undefined}
              disabled={readOnly}
            />
          </div>
        </div>
        {/* <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="change_history" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Estimate</span>
          </div>
          <div className="w-3/4">
            <SidebarEstimateSelect
              value={issue.estimate_point}
              onChange={(val: number | null) =>handleUpdateIssue({ estimate_point: val })}
              disabled={readOnly}
            />
          </div>
        </div> */}
        {/* <Disclosure as="div">
          {({ open }) => (
            <>
              <Disclosure.Button
                as="button"
                type="button"
                className="flex items-center gap-1 text-sm text-custom-text-200"
              >
                Show {open ? "Less" : "More"}
                <Icon iconName={open ? "expand_less" : "expand_more"} className="!text-base" />
              </Disclosure.Button>
              <Disclosure.Panel as="div" className="mt-4 space-y-4">
                Disclosure Panel
              </Disclosure.Panel>
            </>
          )}
        </Disclosure> */}
      </div>
    </div>
  );
};
