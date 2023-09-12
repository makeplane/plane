// react
import React, { useState } from "react";

// next
import { useRouter } from "next/router";

// react hook forms
import { Control, Controller, useWatch } from "react-hook-form";

// icons
import { BlockedIcon, BlockerIcon } from "components/icons";
import { ChevronDown, PlayIcon, User, X, CalendarDays, LayoutGrid, Users } from "lucide-react";

// hooks
import useEstimateOption from "hooks/use-estimate-option";

// ui
import { SecondaryButton, CustomDatePicker } from "components/ui";

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
            <LayoutGrid className="h-4 w-4 flex-shrink-0 text-custom-text-400" />
            <span className="text-sm text-custom-text-400">State</span>
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13.5862 14.5239C13.3459 14.5239 13.1416 14.4398 12.9733 14.2715C12.805 14.1032 12.7209 13.8989 12.7209 13.6585V3.76429C12.7209 3.52391 12.805 3.31958 12.9733 3.15132C13.1416 2.98306 13.3459 2.89893 13.5862 2.89893C13.8266 2.89893 14.031 2.98306 14.1992 3.15132C14.3675 3.31958 14.4516 3.52391 14.4516 3.76429V13.6585C14.4516 13.8989 14.3675 14.1032 14.1992 14.2715C14.031 14.4398 13.8266 14.5239 13.5862 14.5239ZM5.1629 14.5239C5.04676 14.5239 4.93557 14.5018 4.82932 14.4576C4.72308 14.4133 4.63006 14.3513 4.55025 14.2715C4.47045 14.1917 4.40843 14.0986 4.36419 13.9922C4.31996 13.8858 4.29785 13.7746 4.29785 13.6585V11.2643C4.29785 11.0239 4.38198 10.8196 4.55025 10.6513C4.71851 10.4831 4.92283 10.3989 5.16322 10.3989C5.40359 10.3989 5.60791 10.4831 5.77618 10.6513C5.94445 10.8196 6.02859 11.0239 6.02859 11.2643V13.6585C6.02859 13.7746 6.00647 13.8858 5.96223 13.9922C5.91801 14.0986 5.85599 14.1917 5.77618 14.2715C5.69638 14.3513 5.60325 14.4133 5.49678 14.4576C5.39033 14.5018 5.27904 14.5239 5.1629 14.5239ZM9.37473 14.5239C9.13436 14.5239 8.93003 14.4398 8.76176 14.2715C8.59349 14.1032 8.50936 13.8989 8.50936 13.6585V7.5143C8.50936 7.27391 8.59349 7.06958 8.76176 6.90132C8.93003 6.73306 9.13436 6.64893 9.37473 6.64893C9.61511 6.64893 9.81943 6.73306 9.98771 6.90132C10.156 7.06958 10.2401 7.27391 10.2401 7.5143V13.6585C10.2401 13.8989 10.156 14.1032 9.98771 14.2715C9.81943 14.4398 9.61511 14.5239 9.37473 14.5239Z"
                fill="#A3A3A3"
              />
            </svg>

            <span className="text-sm text-custom-text-400">Priority</span>
          </div>
          <div>
            <Controller
              control={control}
              name="priority"
              render={({ field: { value } }) => (
                <PrioritySelect
                  value={value}
                  onChange={(val) => submitChanges({ priority: val })}
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="mb-[6px]">
        <div className="border border-custom-border-200 rounded-[4px] p-2 flex justify-between items-center">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 flex-shrink-0 text-custom-text-400" />
            <span className="text-sm text-custom-text-400">Assignee</span>
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
                  <PlayIcon className="h-4 w-4 flex-shrink-0 -rotate-90 text-custom-text-400" />
                  <span className="text-sm text-custom-text-400">Estimate</span>
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
                <User className="h-4 w-4 flex-shrink-0 text-custom-text-400" />
                <span className="text-sm text-custom-text-400">Parent</span>
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
                  <span className="text-sm text-custom-text-400">Blocking</span>
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
                  <span className="text-sm text-custom-text-400">Blocked by</span>
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
                  <CalendarDays className="w-4 h-4 text-custom-text-400" />
                  <span className="text-sm text-custom-text-400">Due date</span>
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
          <ChevronDown
            size={16}
            className={`ml-1 text-custom-primary-100 ${isViewAllOpen ? "-rotate-180" : ""}`}
          />
        </SecondaryButton>
      </div>
    </div>
  );
};
