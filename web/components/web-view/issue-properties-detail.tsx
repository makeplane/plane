// react
import React, { useState } from "react";

// next
import { useRouter } from "next/router";

// react hook forms
import { Control, Controller, useWatch } from "react-hook-form";

// icons
import { BlockedIcon, BlockerIcon } from "components/icons";
import { ChevronDownIcon, PlayIcon, User, X, CalendarDays } from "lucide-react";

// hooks
import useEstimateOption from "hooks/use-estimate-option";

// ui
import { Icon, SecondaryButton, CustomDatePicker } from "components/ui";

// components
import {
  Label,
  StateSelect,
  PrioritySelect,
  AssigneeSelect,
  EstimateSelect,
  ParentSelect,
  BlockerSelect,
} from "components/web-view";

// types
import type { IIssue } from "types";

type Props = {
  control: Control<IIssue, any>;
  submitChanges: (data: Partial<IIssue>) => Promise<void>;
};

export const IssuePropertiesDetail: React.FC<Props> = (props) => {
  const { control, submitChanges } = props;

  const blockerIssue = useWatch({
    control,
    name: "blocker_issues",
  });

  const blockedIssue = useWatch({
    control,
    name: "blocked_issues",
  });

  const startDate = useWatch({
    control,
    name: "start_date",
  });

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const [isViewAllOpen, setIsViewAllOpen] = useState(false);

  const { isEstimateActive } = useEstimateOption();

  return (
    <div>
      <Label>Details</Label>
      <div className="mb-[6px]">
        <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Icon iconName="grid_view" />
            <span className="text-sm text-custom-text-200">State</span>
          </div>
          <div>
            <Controller
              control={control}
              name="state"
              render={({ field: { value } }) => (
                <StateSelect
                  value={value}
                  onChange={(val: string) => submitChanges({ state: val })}
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="mb-[6px]">
        <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Icon iconName="signal_cellular_alt" />
            <span className="text-sm text-custom-text-200">Priority</span>
          </div>
          <div>
            <Controller
              control={control}
              name="priority"
              render={({ field: { value } }) => (
                <PrioritySelect
                  value={value}
                  onChange={(val: string) => submitChanges({ priority: val })}
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="mb-[6px]">
        <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Icon iconName="person" />
            <span className="text-sm text-custom-text-200">Assignee</span>
          </div>
          <div>
            <Controller
              control={control}
              name="assignees_list"
              render={({ field: { value } }) => (
                <AssigneeSelect
                  value={value}
                  onChange={(val: string) => submitChanges({ assignees_list: [val] })}
                />
              )}
            />
          </div>
        </div>
      </div>
      {isViewAllOpen && (
        <>
          {isEstimateActive && (
            <div className="mb-[6px]">
              <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <PlayIcon className="h-4 w-4 flex-shrink-0 -rotate-90" />
                  <span className="text-sm text-custom-text-200">Estimate</span>
                </div>
                <div>
                  <Controller
                    control={control}
                    name="estimate_point"
                    render={({ field: { value } }) => (
                      <EstimateSelect
                        value={value}
                        onChange={(val) => submitChanges({ estimate_point: val })}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}
          <div className="mb-[6px]">
            <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm text-custom-text-200">Parent</span>
              </div>
              <div>
                <Controller
                  control={control}
                  name="parent"
                  render={({ field: { value } }) => (
                    <ParentSelect
                      value={value}
                      onChange={(val) => submitChanges({ parent: val })}
                    />
                  )}
                />
              </div>
            </div>
          </div>
          <div className="mb-[6px]">
            <div className="border border-custom-border-200 rounded-[4px] p-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <BlockerIcon height={16} width={16} />
                  <span className="text-sm text-custom-text-200">Blocking</span>
                </div>
                <div>
                  <Controller
                    control={control}
                    name="blocker_issues"
                    render={({ field: { value } }) => (
                      <BlockerSelect
                        value={value}
                        onChange={(val) =>
                          submitChanges({
                            blocker_issues: val,
                            blockers_list: val?.map((i: any) => i.blocker_issue_detail?.id ?? ""),
                          })
                        }
                      />
                    )}
                  />
                </div>
              </div>
              {blockerIssue &&
                blockerIssue.map((issue) => (
                  <div
                    key={issue.blocker_issue_detail?.id}
                    className="group inline-flex mr-1 cursor-pointer items-center gap-1 rounded-2xl border border-custom-border-200 px-1.5 py-0.5 text-xs text-yellow-500 duration-300 hover:border-yellow-500/20 hover:bg-yellow-500/20"
                  >
                    <a
                      href={`/${workspaceSlug}/projects/${issue.blocker_issue_detail?.project_detail.id}/issues/${issue.blocker_issue_detail?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <BlockerIcon height={10} width={10} />
                      {`${issue.blocker_issue_detail?.project_detail.identifier}-${issue.blocker_issue_detail?.sequence_id}`}
                    </a>
                    <button
                      type="button"
                      className="duration-300"
                      onClick={() => {
                        const updatedBlockers = blockerIssue.filter(
                          (i) => i.blocker_issue_detail?.id !== issue.blocker_issue_detail?.id
                        );

                        submitChanges({
                          blocker_issues: updatedBlockers,
                          blockers_list: updatedBlockers.map(
                            (i) => i.blocker_issue_detail?.id ?? ""
                          ),
                        });
                      }}
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
          <div className="mb-[6px]">
            <div className="border border-custom-border-200 rounded-[4px] p-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <BlockedIcon height={16} width={16} />
                  <span className="text-sm text-custom-text-200">Blocked by</span>
                </div>
                <div>
                  <Controller
                    control={control}
                    name="blocked_issues"
                    render={({ field: { value } }) => (
                      <BlockerSelect
                        value={value}
                        onChange={(val) =>
                          submitChanges({
                            blocked_issues: val,
                            blocks_list: val?.map((i: any) => i.blocker_issue_detail?.id ?? ""),
                          })
                        }
                      />
                    )}
                  />
                </div>
              </div>
              {blockedIssue &&
                blockedIssue.map((issue) => (
                  <div
                    key={issue.blocked_issue_detail?.id}
                    className="group inline-flex mr-1 cursor-pointer items-center gap-1 rounded-2xl border border-custom-border-200 px-1.5 py-0.5 text-xs text-red-500 duration-300 hover:border-red-500/20 hover:bg-red-500/20"
                  >
                    <a
                      href={`/${workspaceSlug}/projects/${issue.blocked_issue_detail?.project_detail.id}/issues/${issue.blocked_issue_detail?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <BlockedIcon height={10} width={10} />
                      {`${issue?.blocked_issue_detail?.project_detail?.identifier}-${issue?.blocked_issue_detail?.sequence_id}`}
                    </a>
                    <button
                      type="button"
                      className="duration-300"
                      onClick={() => {
                        const updatedBlocked = blockedIssue.filter(
                          (i) => i.blocked_issue_detail?.id !== issue.blocked_issue_detail?.id
                        );

                        submitChanges({
                          blocked_issues: updatedBlocked,
                          blocks_list: updatedBlocked.map((i) => i.blocked_issue_detail?.id ?? ""),
                        });
                      }}
                    >
                      <X className="h-2 w-2" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          <div className="mb-[6px]">
            <div className="border border-custom-border-200 rounded-[4px] p-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <CalendarDays className="w-4 h-4 text-custom-text-200" />
                  <span className="text-sm text-custom-text-200">Due date</span>
                </div>
                <div>
                  <Controller
                    control={control}
                    name="target_date"
                    render={({ field: { value } }) => (
                      <CustomDatePicker
                        placeholder="Due date"
                        value={value}
                        wrapperClassName="w-full"
                        onChange={(val) =>
                          submitChanges({
                            target_date: val,
                          })
                        }
                        className="border-transparent !shadow-none !w-[6.75rem]"
                        minDate={startDate ? new Date(startDate) : undefined}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      <div className="mb-[6px]">
        <SecondaryButton
          type="button"
          onClick={() => setIsViewAllOpen((prev) => !prev)}
          className="w-full flex justify-center items-center gap-1 !py-2"
        >
          <span className="text-base text-custom-primary-100">
            {isViewAllOpen ? "View less" : "View all"}
          </span>
          <ChevronDownIcon
            size={16}
            className={`ml-1 text-custom-primary-100 ${isViewAllOpen ? "-rotate-180" : ""}`}
          />
        </SecondaryButton>
      </div>
    </div>
  );
};
