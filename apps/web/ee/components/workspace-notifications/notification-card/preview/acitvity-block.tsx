"use client";

import { FC, ReactElement, ReactNode } from "react";
import {
  ArrowRightLeft,
  CalendarDays,
  LayoutPanelTop,
  MessageSquare,
  Paperclip,
  Signal,
  Tag,
  Triangle,
  Users,
} from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { IUserLite } from "@plane/types";
import { ArchiveIcon, Avatar, ContrastIcon, CustomersIcon, DiceIcon, DoubleCircleIcon, Intake } from "@plane/ui";
import {
  calculateTimeAgo,
  getFileURL,
  getValidKeysFromObject,
  renderFormattedDate,
  renderFormattedTime,
} from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane web imports
import { useTimeLineRelationOptions } from "@/plane-web/components/relations";
import { TIssueRelationTypes } from "@/plane-web/types";

type TIssueActivityBlock = {
  createdAt: string | undefined;
  notificationField: string;
  ends: "top" | "bottom" | "single" | undefined;
  children: ReactNode;
  triggeredBy: IUserLite | undefined;
};

export const activityIconMap: Record<string, ReactElement> = {
  state: <DoubleCircleIcon width={14} height={14} className="text-custom-text-200" aria-hidden="true" />,
  name: <MessageSquare size={14} className="text-custom-text-200" aria-hidden="true" />,
  description: <MessageSquare size={14} className="text-custom-text-200" aria-hidden="true" />,
  assignees: <Users className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-200" />,
  priority: <Signal size={14} className="text-custom-text-200" aria-hidden="true" />,
  estimate_point: <Triangle size={14} className="text-custom-text-200" aria-hidden="true" />,
  parent: <LayoutPanelTop size={14} className="text-custom-text-200" aria-hidden="true" />,
  start_date: <CalendarDays size={14} className="text-custom-text-200" aria-hidden="true" />,
  target_date: <CalendarDays size={14} className="text-custom-text-200" aria-hidden="true" />,
  cycles: <ContrastIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />,
  modules: <DiceIcon className="h-4 w-4 flex-shrink-0 text-custom-text-200" />,
  labels: <Tag size={14} className="text-custom-text-200" aria-hidden="true" />,
  link: <MessageSquare size={14} className="text-custom-text-200" aria-hidden="true" />,
  attachment: <Paperclip size={14} className="text-custom-text-200" aria-hidden="true" />,
  archived_at: <ArchiveIcon className="h-3.5 w-3.5 text-custom-text-200" aria-hidden="true" />,
  inbox: <Intake className="h-4 w-4 flex-shrink-0 text-custom-text-200" />,
  type: <ArrowRightLeft className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-200" />,
  customer: <CustomersIcon className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-200" />,
  customer_request: <CustomersIcon className="h-3.5 w-3.5 flex-shrink-0 text-custom-text-200" />,
};

export const IssueActivityBlock: FC<TIssueActivityBlock> = (props) => {
  const { ends, children, createdAt, notificationField, triggeredBy } = props;
  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();
  const activityRelations = getValidKeysFromObject(ISSUE_RELATION_OPTIONS);

  const { isMobile } = usePlatformOS();
  return (
    <div
      className={`relative flex w-full gap-3 text-xs ${ends === "top" ? `pb-2` : ends === "bottom" ? `pt-2` : `py-2`}`}
    >
      {ends !== "single" && (
        <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-custom-background-80" aria-hidden />
      )}
      <div className="flex-shrink-0 ring-6 w-7 h-7 rounded-full overflow-hidden flex justify-center items-center z-[4] bg-custom-background-80 text-custom-text-200">
        {notificationField === "comment"
          ? triggeredBy && <Avatar src={getFileURL(triggeredBy.avatar_url)} name={triggeredBy.display_name} size={28} />
          : activityRelations.find((field) => field === notificationField)
            ? ISSUE_RELATION_OPTIONS[notificationField as TIssueRelationTypes]?.icon(14)
            : activityIconMap[notificationField]}
      </div>
      <div className="w-full text-custom-text-200 flex gap-2">
        <span className="truncate"> {children} </span>
        <span className="text-custom-text-300">
          {createdAt && (
            <Tooltip
              isMobile={isMobile}
              tooltipContent={`${renderFormattedDate(createdAt)}, ${renderFormattedTime(createdAt)}`}
            >
              <span className="whitespace-nowrap"> {calculateTimeAgo(createdAt)}</span>
            </Tooltip>
          )}
        </span>
      </div>
    </div>
  );
};
