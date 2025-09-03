import { observer } from "mobx-react";
import { differenceInSeconds } from "date-fns/differenceInSeconds";
import { Check, ChevronRight, CircleAlert, Clock, Dot } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { Avatar } from "@plane/ui";
import {
  calculateTimeAgo,
  cn,
  formatDuration,
  getFileURL,
  renderFormattedDate,
  renderFormattedTime,
} from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
// plane web imports
import { useAutomations } from "@/plane-web/hooks/store/automations/use-automations";

type Props = {
  automationId: string;
  activityId: string;
};

export const AutomationDetailsSidebarActivityRunHistoryItem: React.FC<Props> = observer((props) => {
  const { automationId, activityId } = props;
  // store hooks
  const { getAutomationById } = useAutomations();
  const { getUserDetails } = useMember();
  const { getProjectById } = useProject();
  // derived values
  const automation = getAutomationById(automationId);
  const { getActivityById } = automation?.activity ?? {};
  const activityDetails = getActivityById?.(activityId);
  const runDetails = activityDetails?.automation_run;
  const runInitiator = runDetails?.initiator ? getUserDetails(runDetails.initiator) : undefined;
  const duration = runDetails?.completed_at ? differenceInSeconds(runDetails.completed_at, runDetails.started_at) : 0;
  const projectIdentifier = getProjectById(activityDetails?.project)?.identifier;
  // translation
  const { t } = useTranslation();

  if (!activityDetails) return null;

  return (
    <Disclosure
      as="div"
      className="relative z-[4] w-full bg-custom-background-100 border border-custom-border-200 rounded-lg p-3"
    >
      <Disclosure.Button type="button" className="w-full flex items-center justify-between gap-2 text-xs text-left">
        {({ open }) => (
          <>
            <div className="shrink-0 flex items-center gap-2">
              <span
                className={cn("shrink-0 size-7 rounded-full text-white grid place-items-center", {
                  "bg-green-500": runDetails?.status === "success",
                  "bg-orange-500": runDetails?.status === "failed",
                })}
              >
                {runDetails?.status === "success" ? <Check className="size-4" /> : <CircleAlert className="size-4" />}
              </span>
              <div>
                <p className="font-semibold">
                  {projectIdentifier}-{runDetails?.work_item_sequence_id}
                </p>
                <p className="flex items-center gap-0.5 text-custom-text-200">
                  {renderFormattedTime(activityDetails.created_at ?? "")}
                  <Dot className="shrink-0 size-2" />
                  {calculateTimeAgo(activityDetails.created_at)}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <Tooltip
                tooltipContent={
                  <div className="text-xs font-medium text-custom-text-300">
                    From{" "}
                    <span className="text-custom-text-100">
                      {renderFormattedDate(runDetails?.started_at ?? "")}{" "}
                      {renderFormattedTime(runDetails?.started_at ?? "")}
                    </span>
                    <br />
                    to{" "}
                    <span className="text-custom-text-100">
                      {renderFormattedDate(runDetails?.completed_at ?? "")}{" "}
                      {renderFormattedTime(runDetails?.completed_at ?? "")}
                    </span>
                  </div>
                }
              >
                <span className="shrink-0 bg-custom-background-80 p-1 rounded text-custom-text-200 flex items-center gap-1">
                  <Clock className="shrink-0 size-3" />
                  <span className="font-medium">{formatDuration(duration)}</span>
                </span>
              </Tooltip>
              <button
                type="button"
                className="shrink-0 size-4 grid place-items-center text-custom-text-200 hover:text-custom-text-100"
              >
                <ChevronRight
                  className={cn("size-3 transition-transform", {
                    "rotate-90": open,
                  })}
                />
              </button>
            </div>
          </>
        )}
      </Disclosure.Button>
      <Disclosure.Panel as="div" className="pt-3">
        <hr className="mb-3 border-custom-border-200" />
        {runInitiator && (
          <div className="space-y-1 text-xs font-medium">
            <p>{t("automations.activity.run_history.initiator")}</p>
            <div className="flex items-center gap-1">
              <Avatar src={getFileURL(runInitiator.avatar_url)} name={runInitiator.display_name} />
              <span className="text-custom-text-200">{runInitiator.display_name ?? t("common.deactivated_user")}</span>
            </div>
          </div>
        )}
      </Disclosure.Panel>
    </Disclosure>
  );
});
