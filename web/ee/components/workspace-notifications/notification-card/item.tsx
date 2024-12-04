import { FC, useMemo, useState, Fragment } from "react";
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
import { useWorkspaceNotifications } from "@/hooks/store";
//components
import { NotificationCardPreview } from "@/plane-web/components/workspace-notifications";
import { uniq } from "lodash";
export interface INotificationItem {
  issueId: string;
  workspaceSlug: string;
}
export const NotificationItem: FC<INotificationItem> = observer((props) => {
  const { issueId, workspaceSlug } = props;

  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  const { groupedNotifications } = useWorkspaceNotifications();
  const notificationGroup = groupedNotifications[issueId];
  const issue = notificationGroup[0].data?.issue;
  const unreadCount = notificationGroup.filter((e) => !e.read_at).length;
  const projectId = notificationGroup[0].project;

  const authorIds = uniq(notificationGroup.map((e) => e.triggered_by).filter((id) => id != undefined && id != null));

  const latestNotificationTime = useMemo(() => {
    const latestNotification = orderBy(notificationGroup, (n) => convertToEpoch(n.created_at), "desc")[0];
    if (latestNotification.created_at) return calculateTimeAgo(latestNotification.created_at);
  }, [notificationGroup]);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right-start",
  });

  // states
  const [openState, setOpenState] = useState<boolean>(false);

  if (!notificationGroup || !issue || !authorIds || !projectId) return <></>;

  return (
    <Popover as="div" className={""}>
      <Popover.Button as={Fragment}>
        <div
          className={cn(
            "border-b transition-all py-4 border-custom-border-200 cursor-pointer group w-full",
            unreadCount > 0 ? "bg-custom-primary-100/5" : ""
          )}
          ref={setReferenceElement}
          onClick={() => {}}
          onMouseEnter={() => setOpenState(true)}
          onMouseLeave={() => setOpenState(false)}
        >
          {/* Issue card header */}
          <Row className="flex items-center gap-1">
            <span className="text-sm font-semibold break-words">
              {issue.sequence_id}-{issue.identifier}
            </span>
            <div className="flex-1 flex gap-2 justify-between items-center">
              <span className="overflow-hidden whitespace-normal text-sm break-all truncate line-clamp-1 text-custom-text-100">
                {issue.name}
              </span>
              {unreadCount > 0 && (
                <span className="text-xs px-2 font-bold py-1 text-white bg-custom-primary-300 rounded-lg">
                  {unreadCount}
                </span>
              )}
            </div>
          </Row>
          <Row className="flex items-center justify-between">
            {/* Assignesss avatars / author avatars */}
            <MemberDropdown
              //   projectId={issue?.project}
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
        enter="transition ease-out duration-200"
        show={openState && unreadCount > 0}
        onMouseEnter={() => setOpenState(true)}
        onMouseLeave={() => setOpenState(false)}
      >
        <Popover.Panel {...attributes.popper} className={""}>
          <div ref={setPopperElement} className={"absolute z-10"} style={styles.popper}>
            <NotificationCardPreview
              notificationGroup={notificationGroup}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
            />
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
});
