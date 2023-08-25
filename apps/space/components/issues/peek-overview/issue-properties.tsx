// headless ui
import { Disclosure } from "@headlessui/react";
// import { getStateGroupIcon } from "components/icons";
// components
import { TPeekOverviewModes } from "components/issues/peek-overview";
// icons
import { Icon } from "components/ui";
import { copyTextToClipboard, addSpaceIfCamelCase } from "helpers/string.helper";
import useToast from "hooks/use-toast";

type Props = {
  issue: any;
  mode: TPeekOverviewModes;
  workspaceSlug: string;
};

export const PeekOverviewIssueProperties: React.FC<Props> = ({ issue, mode, workspaceSlug }) => {
  const { setToastAlert } = useToast();

  const startDate = issue.start_date;
  const targetDate = issue.target_date;

  const minDate = startDate ? new Date(startDate) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = targetDate ? new Date(targetDate) : null;
  maxDate?.setDate(maxDate.getDate());

  const handleCopyLink = () => {
    const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(`${originURL}/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`).then(() => {
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
            {/* {getStateGroupIcon(issue.state_detail.group, "16", "16", issue.state_detail.color)} */}
            {issue.project_detail.identifier}-{issue.sequence_id}
          </h6>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleCopyLink} className="-rotate-45">
              <Icon iconName="link" />
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
            <button type="button" className="bg-custom-background-80 text-sm rounded px-2.5 py-0.5">
              {issue.state && (
                <div className="flex items-center gap-1.5 text-left text-custom-text-100">
                  {/* {getStateGroupIcon(issue.state?.group ?? "backlog", "14", "14", issue.state?.color ?? "")}
                  {addSpaceIfCamelCase(selectedState?.name ?? "")} */}
                </div>
              )}
            </button>

            {/* <SidebarStateSelect
              value={issue.state}
              onChange={(val: string) => onChange({ state: val })}
              disabled={readOnly}
            /> */}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="signal_cellular_alt" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Priority</span>
          </div>
          <div className="w-3/4">
            {/* <button
              type="button"
              className={`flex items-center gap-1.5 text-left text-sm capitalize rounded px-2.5 py-0.5 ${
                value === "urgent"
                  ? "border-red-500/20 bg-red-500/20 text-red-500"
                  : value === "high"
                  ? "border-orange-500/20 bg-orange-500/20 text-orange-500"
                  : value === "medium"
                  ? "border-yellow-500/20 bg-yellow-500/20 text-yellow-500"
                  : value === "low"
                  ? "border-green-500/20 bg-green-500/20 text-green-500"
                  : "bg-custom-background-80 border-custom-border-200"
              }`}
            >
              <span className="grid place-items-center -my-1">{getPriorityIcon(value ?? "None", "!text-sm")}</span>
              <span>{value ?? "None"}</span>
            </button> */}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0 w-1/4 flex items-center gap-2 font-medium">
            <Icon iconName="calendar_today" className="!text-base flex-shrink-0" />
            <span className="flex-grow truncate">Due date</span>
          </div>
          {/* <div>
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
          </div> */}
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
