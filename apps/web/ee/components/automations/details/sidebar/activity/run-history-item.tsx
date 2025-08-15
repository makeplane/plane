import { observer } from "mobx-react";
import { Check, ChevronRight, CircleAlert, Clock, Dot } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/ui";
import { calculateTimeAgo, cn, getFileURL, renderFormattedTime } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
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
  // derived values
  const automation = getAutomationById(automationId);
  const { getActivityById } = automation?.activity ?? {};
  const activityDetails = getActivityById?.(activityId);
  const activityInitiator = activityDetails?.created_by ? getUserDetails(activityDetails.created_by) : undefined;
  // translation
  const { t } = useTranslation();

  if (!activityDetails) return null;

  return (
    <Disclosure as="div" className="border border-custom-border-200 rounded-lg p-3">
      <Disclosure.Button type="button" className="flex items-center gap-2 text-xs pb-3">
        {({ open }) => (
          <>
            <div>
              <span className="shrink-0 size-7 rounded-full bg-custom-background-80 text-white">
                {/* <CircleAlert className="size-4" /> */}
                <Check className="size-4" />
              </span>
              <div>
                <p className="font-semibold">RI-336</p>
                <p className="flex items-center gap-0.5 text-custom-text-200">
                  {renderFormattedTime(activityDetails.created_at ?? "")}
                  <Dot className="shrink-0 size-1.5" />
                  {calculateTimeAgo(activityDetails.created_at)}
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="shrink-0 bg-custom-background-80 p-1 rounded text-custom-text-200 flex items-center gap-1">
                <Clock className="shrink-0 size-3" />
                <span className="font-medium">12.1s</span>
              </span>
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
        {activityInitiator && (
          <div className="space-y-1 text-xs font-medium">
            <p>{t("automations.activity.run_history.initiator")}</p>
            <div className="flex items-center gap-1">
              <Avatar src={getFileURL(activityInitiator.avatar_url)} name={activityInitiator.display_name} />
              <span className="text-custom-text-200">{activityInitiator.display_name}</span>
            </div>
          </div>
        )}
      </Disclosure.Panel>
    </Disclosure>
  );
});
