import { FC, useMemo, useState, Fragment } from "react";
import { uniq } from "lodash";
import orderBy from "lodash/orderBy";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";
import { Row } from "@plane/ui";
import { MemberDropdown } from "@/components/dropdowns";
//helpers
import { cn } from "@/helpers/common.helper";
import { calculateTimeAgo, convertToEpoch } from "@/helpers/date-time.helper";
//store
import { useIssueDetail, useWorkspaceNotifications } from "@/hooks/store";
//components
import { NotificationCardPreview, NotificationOption } from "@/plane-web/components/workspace-notifications";
export interface INotificationItem {
  issueId: string;
  workspaceSlug: string;
  workspaceId: string;
}
export const NotificationItem: FC<INotificationItem> = observer((props) => {
  const { issueId, workspaceSlug, workspaceId } = props;

  //states
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const [isSnoozeStateModalOpen, setIsSnoozeStateModalOpen] = useState(false);
  const [customSnoozeModal, setCustomSnoozeModal] = useState(false);
  //hooks
  const { groupedNotificationsByIssueId, markNotificationGroupRead, hasInboxIssue, setCurrentSelectedNotificationId } =
    useWorkspaceNotifications();
  const { getIsIssuePeeked, setPeekIssue } = useIssueDetail();

  //derived values
  const groupedNotifications = groupedNotificationsByIssueId(workspaceId);
  const notificationGroup = groupedNotifications[issueId];
  const issue = notificationGroup[0].data?.issue;
  const unreadCount = notificationGroup.filter((e) => !e.read_at).length;
  const projectId = notificationGroup[0].project;

  const authorIds: string[] = uniq(
    notificationGroup.map((e) => e.triggered_by).filter((id): id is string => id != undefined && id != null)
  );

  const latestNotificationTime = useMemo(() => {
    const latestNotification = orderBy(notificationGroup, (n) => convertToEpoch(n.created_at), "desc")[0];
    if (latestNotification.created_at) return calculateTimeAgo(latestNotification.created_at);
  }, [notificationGroup]);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right-start",
  });

  const handleNotificationIssuePeekOverview = async () => {
    if (workspaceSlug && projectId && issueId && !isSnoozeStateModalOpen && !customSnoozeModal) {
      setPeekIssue(undefined);
      setCurrentSelectedNotificationId(notificationGroup[0].id);

      // make the notification as read
      if (unreadCount > 0) {
        try {
          await markNotificationGroupRead(notificationGroup, workspaceSlug);
        } catch (error) {
          console.error(error);
        }
      }

      if (!hasInboxIssue(notificationGroup)) {
        if (!getIsIssuePeeked(issueId)) setPeekIssue({ workspaceSlug, projectId, issueId });
      }
    }
  };

  // states
  const [showPreview, setShowPreview] = useState<boolean>(false);

  if (!notificationGroup || !issue || !issue.id || !authorIds || !projectId) return <></>;

  return (
    <Popover as="div" className={""}>
      <Popover.Button as={Fragment}>
        <div
          className={cn(
            "border-b relative transition-all py-4 border-custom-border-200 cursor-pointer group w-full",
            getIsIssuePeeked(issue.id) && "bg-custom-background-80/30",
            unreadCount > 0 ? "bg-custom-primary-100/5" : ""
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
          <Row className="flex items-center gap-1">
            <span className="text-sm font-medium break-words">
              {issue.sequence_id}-{issue.identifier}
            </span>
            <div className="flex-1 flex gap-2 justify-between items-center">
              <span className="overflow-hidden whitespace-normal text-sm break-all truncate line-clamp-1 text-custom-text-00">
                {issue.name}
              </span>
            </div>
            <NotificationOption
              workspaceSlug={workspaceSlug}
              issueId={issueId}
              unreadCount={unreadCount}
              notificationGroup={notificationGroup}
              isSnoozeStateModalOpen={isSnoozeStateModalOpen}
              setIsSnoozeStateModalOpen={setIsSnoozeStateModalOpen}
              customSnoozeModal={customSnoozeModal}
              setCustomSnoozeModal={setCustomSnoozeModal}
            />
            {unreadCount > 0 && (
              <span className="text-xs px-[5px] font-medium group-hover:hidden py-[1px] text-white bg-custom-primary-300 rounded-md">
                {unreadCount}
              </span>
            )}
          </Row>
          <Row className="flex items-center justify-between mt-2">
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
            <div />
            <span className="text-xs text-custom-text-100">{latestNotificationTime}</span>
          </Row>
        </div>
      </Popover.Button>
      <Transition
        as={"div"}
        show={showPreview}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
      >
        <Popover.Panel {...attributes.popper} className={""}>
          <div ref={setPopperElement} className={"absolute z-10"} style={styles.popper}>
            <NotificationCardPreview
              notificationGroup={notificationGroup}
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
