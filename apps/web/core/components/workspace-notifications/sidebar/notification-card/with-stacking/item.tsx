/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { FC } from "react";
import { useMemo, useState } from "react";
import { orderBy, uniq } from "lodash-es";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";
// plane imports
import type { TNotification } from "@plane/types";
import { EIssueServiceType } from "@plane/types";
import { calculateTimeAgo, convertToEpoch, cn, generateWorkItemLink } from "@plane/utils";
// components
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";
//store
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
//components
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useIssueType } from "@/plane-web/hooks/store";
// local imports
import { NotificationOption } from "./options";
import { NotificationCardPreview } from "./preview";
import { useRouter } from "@/app/compat/next/navigation";
import { usePathname } from "next/navigation";

export interface INotificationItem {
  issueId: string;
  workspaceSlug: string;
  workspaceId: string;
  onNotificationClick?: () => void;
}
export const NotificationItem = observer(function NotificationItem(props: INotificationItem) {
  const { issueId, workspaceSlug, workspaceId, onNotificationClick } = props;
  // router
  const router = useRouter();
  //states
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isSnoozeStateModalOpen, setIsSnoozeStateModalOpen] = useState(false);
  const [customSnoozeModal, setCustomSnoozeModal] = useState(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  //hooks
  const {
    getNotificationsGroupedByIssue,
    markBulkNotificationsAsRead,
    containsInboxIssue,
    setCurrentSelectedNotificationId,
    setHighlightedActivityIds,
  } = useWorkspaceNotifications();
  const pathname = usePathname();
  const isInboxPage = pathname.includes("/notifications");
  const groupedNotifications = getNotificationsGroupedByIssue(workspaceId);
  const notificationList = groupedNotifications[issueId];
  const issue = notificationList[0].data?.issue;

  const { getIsIssuePeeked, setPeekIssue } = useIssueDetail(EIssueServiceType.ISSUES);
  const { setPeekIssue: setPeekEpic, getIsIssuePeeked: getIsEpicPeeked } = useIssueDetail(EIssueServiceType.EPICS);

  //derived values
  const workItemType = useIssueType(issue?.type_id);
  const unreadCount = notificationList.filter((e) => !e.read_at).length;
  const projectId = notificationList[0].project;
  const isWorkItemPeeked = workItemType?.is_epic ? getIsEpicPeeked(issueId) : getIsIssuePeeked(issueId);

  const authorIds: string[] = uniq(
    notificationList.map((e) => e.triggered_by).filter((id): id is string => id != undefined && id != null)
  );

  const latestNotificationTime = useMemo(() => {
    const latestNotification = orderBy(notificationList, (n) => convertToEpoch(n.created_at), "desc")[0];
    if (latestNotification.created_at) return calculateTimeAgo(latestNotification.created_at);
  }, [notificationList]);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "left-start",
    strategy: "fixed",
  });

  const getUnreadActivityIds = (notificationList: TNotification[]): string[] =>
    notificationList
      .filter((e) => !e.read_at)
      .map((e) =>
        e.data?.issue_activity?.field === "comment" ? e.data?.issue_activity?.new_identifier : e.data?.issue_activity.id
      )
      .filter((id): id is string => id != undefined); // added "id is string" predicate to avoid type error

  const handleNotificationIssuePeekOverview = async () => {
    setShowPreview(false);
    if (workspaceSlug && projectId && issueId && !isSnoozeStateModalOpen && !customSnoozeModal) {
      onNotificationClick?.();

      // reset peek view

      setPeekIssue(undefined);
      setPeekEpic(undefined);
      setCurrentSelectedNotificationId(notificationList[0].id);
      // make the notification as read
      if (unreadCount > 0) {
        try {
          setHighlightedActivityIds(getUnreadActivityIds(notificationList));
          //filter unread notifications and set activity ids to highlight
          await markBulkNotificationsAsRead(notificationList, workspaceSlug);
        } catch (error) {
          console.error(error);
        }
      }

      if (!isInboxPage) {
        const workItemLink = generateWorkItemLink({
          workspaceSlug,
          projectId,
          issueId,
          projectIdentifier: issue?.identifier,
          sequenceId: issue?.sequence_id,
        });

        if (workItemLink) router.push(workItemLink);
        return;
      }

      if (!containsInboxIssue(notificationList)) {
        const peekMethod = workItemType?.is_epic ? setPeekEpic : setPeekIssue;
        if (!peekMethod) return;
        peekMethod({ workspaceSlug, projectId, issueId });
      }
    }
  };

  if (!notificationList || !issue || !issue.id || !authorIds || !projectId) return <></>;

  return (
    <Popover as="div" className={""}>
      <div
        className={cn(
          " relative transition-all py-4 cursor-pointer group w-full bg-layer-transparent hover:bg-layer-transparent-hover",
          {
            "bg-layer-1/30": isWorkItemPeeked,
            "bg-accent-primary/5": unreadCount > 0,
          }
        )}
        ref={setReferenceElement}
        onClick={(e) => {
          e.preventDefault();
          handleNotificationIssuePeekOverview();
        }}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        {/* Issue card header */}
        <div className="flex items-center gap-1 justify-between px-4">
          <div className="flex-1 flex h-5 gap-2 justify-between items-center">
            <span className="overflow-hidden whitespace-normal text-body-xs-medium break-all truncate line-clamp-1 text-primary">
              {issue.name}
            </span>
          </div>
          <NotificationOption
            workspaceSlug={workspaceSlug}
            issueId={issueId}
            unreadCount={unreadCount}
            notificationList={notificationList}
            isSnoozeStateModalOpen={isSnoozeStateModalOpen}
            setIsSnoozeStateModalOpen={setIsSnoozeStateModalOpen}
            customSnoozeModal={customSnoozeModal}
            setCustomSnoozeModal={setCustomSnoozeModal}
          />
          {unreadCount > 0 && (
            <span className="text-caption-sm-medium px-[5px] group-hover:hidden py-[1px] text-on-color bg-accent-primary rounded-md">
              {unreadCount <= 20 ? unreadCount : `20+`}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 px-4">
          <div className="flex items-center gap-2">
            {issue.sequence_id && issue.identifier && (
              <>
                <IssueIdentifier
                  issueSequenceId={issue.sequence_id}
                  projectIdentifier={issue.identifier}
                  projectId={projectId}
                  issueTypeId={issue.type_id}
                  size="xs"
                  variant="primary-subtle"
                />
              </>
            )}
            <div className="bg-layer-1/70 w-1 h-1 rounded-full" />
            {/* Author avatars */}
            <MemberDropdown
              value={authorIds}
              onChange={() => {}}
              disabled
              multiple
              buttonVariant={authorIds?.length > 0 ? "transparent-without-text" : "border-without-text"}
              buttonClassName={authorIds?.length > 0 ? "hover:bg-transparent px-0" : ""}
              showTooltip={authorIds?.length === 0}
              placeholder="Assignees"
              optionsClassName="z-10"
              tooltipContent=""
            />
          </div>
          <div />
          <span className="text-caption-sm-regular text-primary">{latestNotificationTime}</span>
        </div>
      </div>

      <Transition
        as={"div"}
        show={showPreview}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        <Popover.Panel {...attributes.popper}>
          <div ref={setPopperElement} className={"absolute z-10 max-w-[600px]"} style={styles.popper}>
            <NotificationCardPreview
              notificationList={notificationList}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueData={issue}
            />
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
});
