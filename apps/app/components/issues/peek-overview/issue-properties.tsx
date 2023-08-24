// headless ui
import { Disclosure } from "@headlessui/react";
// components
import {
  SidebarAssigneeSelect,
  SidebarEstimateSelect,
  SidebarPrioritySelect,
  SidebarStateSelect,
} from "components/issues";
// icons
import { CustomDatePicker, Icon } from "components/ui";
// helpers
import { renderShortDateWithYearFormat } from "helpers/date-time.helper";
// types
import { IIssue } from "types";

type Props = {
  issue: IIssue;
  onChange: (issueProperty: Partial<IIssue>) => void;
  readOnly: boolean;
};

export const PeekOverviewIssueProperties: React.FC<Props> = ({ issue, onChange, readOnly }) => {
  const startDate = issue.start_date;
  const targetDate = issue.target_date;

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
          <Icon iconName="radio_button_checked" className="!text-base" />
          State
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
          <Icon iconName="group" className="!text-base" />
          Assignees
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
          <Icon iconName="signal_cellular_alt" className="!text-base" />
          Priority
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
          <Icon iconName="calendar_today" className="!text-base" />
          Start date
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
          <Icon iconName="calendar_today" className="!text-base" />
          Due date
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
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
          <Icon iconName="change_history" className="!text-base" />
          Estimate
        </div>
        <div className="w-3/4">
          <SidebarEstimateSelect
            value={issue.estimate_point}
            onChange={(val: number | null) => onChange({ estimate_point: val })}
            disabled={readOnly}
          />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
          <Icon iconName="supervised_user_circle" className="!text-base" />
          Parent
        </div>
      </div>
      <Disclosure as="div">
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
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
                  <Icon iconName="radio_button_checked" className="!text-base" />
                  State
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
                  <Icon iconName="group" className="!text-base" />
                  Assignees
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
                  <Icon iconName="calendar_today" className="!text-base" />
                  Due date
                </div>
                <div>
                  {issue.target_date ? (
                    renderShortDateWithYearFormat(issue.target_date)
                  ) : (
                    <span className="text-custom-text-200">Empty</span>
                  )}
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
};
