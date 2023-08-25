// headless ui
import { Disclosure } from "@headlessui/react";
import { getStateGroupIcon } from "components/icons";
// components
import {
  SidebarAssigneeSelect,
  SidebarEstimateSelect,
  SidebarPrioritySelect,
  SidebarStateSelect,
  TPeekOverviewModes,
} from "components/issues";
// icons
import { CustomDatePicker, Icon } from "components/ui";
import { copyTextToClipboard } from "helpers/string.helper";
import useToast from "hooks/use-toast";
// types
import { IIssue } from "types";

type Props = {
  handleDeleteIssue: () => void;
  issue: IIssue;
  mode: TPeekOverviewModes;
  onChange: (issueProperty: Partial<IIssue>) => void;
  readOnly: boolean;
  workspaceSlug: string;
};

export const PeekOverviewIssueProperties: React.FC<Props> = ({
  handleDeleteIssue,
  issue,
  mode,
  onChange,
  readOnly,
  workspaceSlug,
}) => {
  const { setToastAlert } = useToast();

  const startDate = issue.start_date;
  const targetDate = issue.target_date;

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  const handleCopyLink = () => {
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`
    ).then(() => {
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
            {getStateGroupIcon(issue.state_detail.group, "16", "16", issue.state_detail.color)}
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
              onChange={(val: string) => onChange({ state: val })}
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
              value={issue.assignees_list}
              onChange={(val: string[]) => onChange({ assignees_list: val })}
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
              onChange={(val: string) => onChange({ priority: val })}
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
            {issue.start_date ? (
              <CustomDatePicker
                placeholder="Start date"
                value={issue.start_date}
                onChange={(val) =>
                  onChange({
                    start_date: val,
                  })
                }
                className="bg-custom-background-100"
                wrapperClassName="w-full"
                maxDate={maxDate ?? undefined}
                disabled={readOnly}
              />
            ) : (
              <span className="text-custom-text-200">Empty</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="calendar_today" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Due date</span>
          </div>
          <div>
            {issue.target_date ? (
              <CustomDatePicker
                placeholder="Due date"
                value={issue.target_date}
                onChange={(val) =>
                  onChange({
                    target_date: val,
                  })
                }
                className="bg-custom-background-100"
                wrapperClassName="w-full"
                minDate={minDate ?? undefined}
                disabled={readOnly}
              />
            ) : (
              <span className="text-custom-text-200">Empty</span>
            )}
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
              onChange={(val: number | null) => onChange({ estimate_point: val })}
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
