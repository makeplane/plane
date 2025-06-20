"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// store hooks
// icons
import {
  TagIcon,
  CopyPlus,
  Calendar,
  Link2Icon,
  Users2Icon,
  ArchiveIcon,
  PaperclipIcon,
  ContrastIcon,
  TriangleIcon,
  LayoutGridIcon,
  SignalMediumIcon,
  MessageSquareIcon,
  UsersIcon,
} from "lucide-react";
import { IIssueActivity } from "@plane/types";
import { Tooltip, BlockedIcon, BlockerIcon, RelatedIcon, LayersIcon, DiceIcon, Intake, EpicIcon } from "@plane/ui";
import { renderFormattedDate, generateWorkItemLink, capitalizeFirstLetter } from "@plane/utils";
// helpers
import { useLabel } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// types

export const IssueLink = ({ activity }: { activity: IIssueActivity }) => {
  // router params
  const { workspaceSlug } = useParams();
  const { isMobile } = usePlatformOS();

  const workItemLink = generateWorkItemLink({
    workspaceSlug: workspaceSlug?.toString() ?? activity.workspace_detail?.slug,
    projectId: activity?.project,
    issueId: activity?.issue,
    projectIdentifier: activity?.project_detail?.identifier,
    sequenceId: activity?.issue_detail?.sequence_id,
  });

  return (
    <Tooltip
      tooltipContent={activity?.issue_detail ? activity.issue_detail.name : "This work item has been deleted"}
      isMobile={isMobile}
    >
      {activity?.issue_detail ? (
        <a
          aria-disabled={activity.issue === null}
          href={workItemLink}
          target={activity.issue === null ? "_self" : "_blank"}
          rel={activity.issue === null ? "" : "noopener noreferrer"}
          className="inline items-center gap-1 font-medium text-custom-text-100 hover:underline"
        >
          <span className="whitespace-nowrap">{`${activity.project_detail.identifier}-${activity.issue_detail.sequence_id}`}</span>{" "}
          <span className="font-normal break-all">{activity.issue_detail?.name}</span>
        </a>
      ) : (
        <span className="inline-flex items-center gap-1 font-medium text-custom-text-100 whitespace-nowrap">
          {" a work item"}{" "}
        </span>
      )}
    </Tooltip>
  );
};

const UserLink = ({ activity }: { activity: IIssueActivity }) => {
  // router params
  const { workspaceSlug } = useParams();

  return (
    <a
      href={`/${workspaceSlug ?? activity.workspace_detail?.slug}/profile/${
        activity.new_identifier ?? activity.old_identifier
      }`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center font-medium text-custom-text-100 hover:underline"
    >
      {activity.new_value && activity.new_value !== "" ? activity.new_value : activity.old_value}
    </a>
  );
};

const LabelPill = observer(({ labelId, workspaceSlug }: { labelId: string; workspaceSlug: string }) => {
  // store hooks
  const { workspaceLabels, fetchWorkspaceLabels } = useLabel();

  useEffect(() => {
    if (!workspaceLabels) fetchWorkspaceLabels(workspaceSlug);
  }, [fetchWorkspaceLabels, workspaceLabels, workspaceSlug]);

  return (
    <span
      className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
      style={{
        backgroundColor: workspaceLabels?.find((l) => l.id === labelId)?.color ?? "#000000",
      }}
      aria-hidden="true"
    />
  );
});

const inboxActivityMessage = {
  declined: {
    showIssue: "declined work item",
    noIssue: "declined this work item from intake.",
  },
  snoozed: {
    showIssue: "snoozed work item",
    noIssue: "snoozed this work item.",
  },
  accepted: {
    showIssue: "accepted work item",
    noIssue: "accepted this work item from intake.",
  },
  markedDuplicate: {
    showIssue: "declined work item",
    noIssue: "declined this work item from intake by marking a duplicate work item.",
  },
};

const getInboxUserActivityMessage = (activity: IIssueActivity, showIssue: boolean) => {
  switch (activity.verb) {
    case "-1":
      return showIssue ? inboxActivityMessage.declined.showIssue : inboxActivityMessage.declined.noIssue;
    case "0":
      return showIssue ? inboxActivityMessage.snoozed.showIssue : inboxActivityMessage.snoozed.noIssue;
    case "1":
      return showIssue ? inboxActivityMessage.accepted.showIssue : inboxActivityMessage.accepted.noIssue;
    case "2":
      return showIssue ? inboxActivityMessage.markedDuplicate.showIssue : inboxActivityMessage.markedDuplicate.noIssue;
    default:
      return "updated intake work item status.";
  }
};

const activityDetails: {
  [key: string]: {
    message: (activity: IIssueActivity, showIssue: boolean, workspaceSlug: string) => React.ReactNode;
    icon: React.ReactNode;
  };
} = {
  assignees: {
    message: (activity, showIssue) => {
      if (activity.old_value === "")
        return (
          <>
            added a new assignee <UserLink activity={activity} />
            {showIssue && (
              <>
                {" "}
                to <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            removed the assignee <UserLink activity={activity} />
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
          </>
        );
    },
    icon: <Users2Icon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  archived_at: {
    message: (activity) => {
      if (activity.new_value === "restore")
        return (
          <>
            restored <IssueLink activity={activity} />
          </>
        );
      else
        return (
          <>
            archived <IssueLink activity={activity} />
          </>
        );
    },
    icon: <ArchiveIcon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  attachment: {
    message: (activity, showIssue) => {
      if (activity.verb === "created")
        return (
          <>
            uploaded a new attachment
            {showIssue && (
              <>
                {" "}
                to <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            removed an attachment
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
          </>
        );
    },
    icon: <PaperclipIcon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  description: {
    message: (activity, showIssue) => (
      <>
        updated the description
        {showIssue && (
          <>
            {" "}
            of <IssueLink activity={activity} />
          </>
        )}
      </>
    ),
    icon: <MessageSquareIcon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  estimate_point: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            removed the estimate point
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            set the estimate point to {activity.new_value}
            {showIssue && (
              <>
                {" "}
                for <IssueLink activity={activity} />
              </>
            )}
          </>
        );
    },
    icon: <TriangleIcon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  issue: {
    message: (activity) => {
      if (activity.verb === "created")
        return (
          <>
            created <IssueLink activity={activity} />
          </>
        );
      else if (activity.verb === "converted")
        return (
          <>
            converted <IssueLink activity={activity} /> to an epic
          </>
        );
      else
        return (
          <>
            deleted <IssueLink activity={activity} />
          </>
        );
    },
    icon: <LayersIcon width={12} height={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  epic: {
    message: (activity) => {
      if (activity.verb === "created")
        return (
          <>
            created <IssueLink activity={activity} />
          </>
        );
      else if (activity.verb === "converted")
        return (
          <>
            converted <IssueLink activity={activity} /> to a work item
          </>
        );
      else
        return (
          <>
            deleted <IssueLink activity={activity} />
          </>
        );
    },
    icon: <EpicIcon width={12} height={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  labels: {
    message: (activity, showIssue, workspaceSlug) => {
      if (activity.old_value === "")
        return (
          <span className="overflow-hidden">
            added a new label{" "}
            <span className="inline-flex items-center gap-2 rounded-full border border-custom-border-300 px-2 py-0.5 text-xs">
              <LabelPill labelId={activity.new_identifier ?? ""} workspaceSlug={workspaceSlug} />
              <span className="flex-shrink font-medium text-custom-text-100 break-all line-clamp-1">
                {activity.new_value}
              </span>
            </span>
            {showIssue && (
              <span className="">
                {" "}
                to <IssueLink activity={activity} />
              </span>
            )}
          </span>
        );
      else
        return (
          <>
            removed the label{" "}
            <span className="inline-flex items-center gap-2 rounded-full border border-custom-border-300 px-2 py-0.5 text-xs">
              <LabelPill labelId={activity.old_identifier ?? ""} workspaceSlug={workspaceSlug} />
              <span className="flex-shrink font-medium text-custom-text-100 break-all line-clamp-1">
                {activity.old_value}
              </span>
            </span>
            {showIssue && (
              <span>
                {" "}
                from <IssueLink activity={activity} />
              </span>
            )}
          </>
        );
    },
    icon: <TagIcon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  link: {
    message: (activity, showIssue) => {
      if (activity.verb === "created")
        return (
          <>
            added this{" "}
            <a
              href={`${activity.new_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              link
            </a>
            {showIssue && (
              <>
                {" "}
                to <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else if (activity.verb === "updated")
        return (
          <>
            updated the{" "}
            <a
              href={`${activity.old_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              link
            </a>
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            removed this{" "}
            <a
              href={`${activity.old_value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              link
            </a>
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
          </>
        );
    },
    icon: <Link2Icon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  cycles: {
    message: (activity, showIssue, workspaceSlug) => {
      if (activity.verb === "created")
        return (
          <>
            <span className="flex-shrink-0">
              added {showIssue ? <IssueLink activity={activity} /> : "this work item"}{" "}
              <span className="whitespace-nowrap">to the cycle</span>{" "}
            </span>
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              <span className="break-all">{activity.new_value}</span>
            </a>
          </>
        );
      else if (activity.verb === "updated")
        return (
          <>
            <span className="flex-shrink-0 whitespace-nowrap">set the cycle to </span>
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/cycles/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              <span className="break-all">{activity.new_value}</span>
            </a>
          </>
        );
      else
        return (
          <>
            removed <IssueLink activity={activity} /> from the cycle{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/cycles/${activity.old_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              <span className="break-all">{activity.old_value}</span>
            </a>
          </>
        );
    },
    icon: <ContrastIcon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  modules: {
    message: (activity, showIssue, workspaceSlug) => {
      if (activity.verb === "created")
        return (
          <>
            added {showIssue ? <IssueLink activity={activity} /> : "this work item"} to the module{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/modules/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              <span className="break-all">{activity.new_value}</span>
            </a>
          </>
        );
      else if (activity.verb === "updated")
        return (
          <>
            set the module to{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/modules/${activity.new_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              <span className="break-all">{activity.new_value}</span>
            </a>
          </>
        );
      else
        return (
          <>
            removed <IssueLink activity={activity} /> from the module{" "}
            <a
              href={`/${workspaceSlug}/projects/${activity.project}/modules/${activity.old_identifier}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline items-center gap-1 font-medium text-custom-text-100 hover:underline"
            >
              <span className="break-all">{activity.old_value}</span>
            </a>
          </>
        );
    },
    icon: <DiceIcon className="h-3 w-3 !text-custom-text-200" aria-hidden="true" />,
  },
  name: {
    message: (activity, showIssue) => (
      <>
        set the title to <span className="break-all">{activity.new_value}</span>
        {showIssue && (
          <>
            {" "}
            of <IssueLink activity={activity} />
          </>
        )}
      </>
    ),
    icon: <MessageSquareIcon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  parent: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            removed the parent{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">{activity.old_value}</span>
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            set the parent to{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">{activity.new_value}</span>
            {showIssue && (
              <>
                {" "}
                for <IssueLink activity={activity} />
              </>
            )}
          </>
        );
    },
    icon: <UsersIcon className="h-3 w-3 !text-custom-text-200" aria-hidden="true" />,
  },
  priority: {
    message: (activity, showIssue) => (
      <>
        set the priority to{" "}
        <span className="font-medium text-custom-text-100">
          {activity.new_value ? capitalizeFirstLetter(activity.new_value) : "None"}
        </span>
        {showIssue && (
          <>
            {" "}
            for <IssueLink activity={activity} />
          </>
        )}
      </>
    ),
    icon: <SignalMediumIcon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  relates_to: {
    message: (activity, showIssue) => {
      if (activity.old_value === "")
        return (
          <>
            marked that {showIssue ? <IssueLink activity={activity} /> : "this work item"} relates to{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            removed the relation from{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">{activity.old_value}</span>.
          </>
        );
    },
    icon: <RelatedIcon height="12" width="12" className="text-custom-text-200" />,
  },
  blocking: {
    message: (activity, showIssue) => {
      if (activity.old_value === "")
        return (
          <>
            marked {showIssue ? <IssueLink activity={activity} /> : "this work item"} is blocking work item{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            removed the blocking work item{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">{activity.old_value}</span>.
          </>
        );
    },
    icon: <BlockerIcon height="12" width="12" className="text-custom-text-200" />,
  },
  blocked_by: {
    message: (activity, showIssue) => {
      if (activity.old_value === "")
        return (
          <>
            marked {showIssue ? <IssueLink activity={activity} /> : "this work item"} is being blocked by{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            removed {showIssue ? <IssueLink activity={activity} /> : "this work item"} being blocked by work item{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">{activity.old_value}</span>.
          </>
        );
    },
    icon: <BlockedIcon height="12" width="12" className="text-custom-text-200" />,
  },
  duplicate: {
    message: (activity, showIssue) => {
      if (activity.old_value === "")
        return (
          <>
            marked {showIssue ? <IssueLink activity={activity} /> : "this work item"} as duplicate of{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">{activity.new_value}</span>.
          </>
        );
      else
        return (
          <>
            removed {showIssue ? <IssueLink activity={activity} /> : "this work item"} as a duplicate of{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">{activity.old_value}</span>.
          </>
        );
    },
    icon: <CopyPlus size={12} className="text-custom-text-200" />,
  },
  state: {
    message: (activity, showIssue) => (
      <>
        set the state to <span className="font-medium text-custom-text-100 break-all">{activity.new_value}</span>
        {showIssue && (
          <>
            {" "}
            for <IssueLink activity={activity} />
          </>
        )}
      </>
    ),
    icon: <LayoutGridIcon size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  start_date: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            removed the start date
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            set the start date to{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">
              {renderFormattedDate(activity.new_value)}
            </span>
            {showIssue && (
              <>
                {" "}
                for <IssueLink activity={activity} />
              </>
            )}
          </>
        );
    },
    icon: <Calendar size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  target_date: {
    message: (activity, showIssue) => {
      if (!activity.new_value)
        return (
          <>
            removed the due date
            {showIssue && (
              <>
                {" "}
                from <IssueLink activity={activity} />
              </>
            )}
          </>
        );
      else
        return (
          <>
            set the due date to{" "}
            <span className="font-medium text-custom-text-100 whitespace-nowrap">
              {renderFormattedDate(activity.new_value)}
            </span>
            {showIssue && (
              <>
                <IssueLink activity={activity} />
              </>
            )}
          </>
        );
    },
    icon: <Calendar size={12} className="text-custom-text-200" aria-hidden="true" />,
  },
  inbox: {
    message: (activity, showIssue) => (
      <>
        {getInboxUserActivityMessage(activity, showIssue)}
        {showIssue && (
          <>
            {" "}
            <IssueLink activity={activity} />
          </>
        )}
        {activity.verb === "2" && ` from intake by marking a duplicate work item.`}
      </>
    ),
    icon: <Intake className="size-3 text-custom-text-200" aria-hidden="true" />,
  },
};

export const ActivityIcon = ({ activity }: { activity: IIssueActivity }) => (
  <>{activityDetails[activity.field as keyof typeof activityDetails]?.icon}</>
);

type ActivityMessageProps = {
  activity: IIssueActivity;
  showIssue?: boolean;
};

export const ActivityMessage = ({ activity, showIssue = false }: ActivityMessageProps) => {
  // router params
  const { workspaceSlug } = useParams();
  const activityField = activity.field ?? "issue";

  return (
    <>
      {activityDetails[activityField as keyof typeof activityDetails]?.message(
        activity,
        showIssue,
        workspaceSlug ? workspaceSlug.toString() : (activity.workspace_detail?.slug ?? "")
      )}
    </>
  );
};
