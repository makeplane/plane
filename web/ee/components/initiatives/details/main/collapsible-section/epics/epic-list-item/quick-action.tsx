"use client";

import { observer } from "mobx-react";
import { LinkIcon, MoreHorizontal, Trash2 } from "lucide-react";
// Plane
import { EIssueServiceType } from "@plane/constants";
import { CustomMenu, setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
import { cn } from "@plane/utils";
// helpers
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useIssueDetail } from "@/hooks/store";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  workspaceSlug: string;
  epicId: string;
  initiativeId: string;
  disabled?: boolean;
};

export const EpicQuickActions: React.FC<Props> = observer((props: Props) => {
  const { workspaceSlug, initiativeId, epicId, disabled } = props;
  //  store hooks
  const {
    initiative: { removeEpicFromInitiative },
  } = useInitiatives();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);

  // derived values
  const epic = getIssueById(epicId);
  const epicLink = `${workspaceSlug}/projects/${epic?.project_id}/issues/${epic?.id}`;

  // handler
  const handleCopyText = () =>
    copyUrlToClipboard(epicLink).then(() =>
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Link Copied!",
        message: "Epic link copied to clipboard.",
      })
    );

  if (!epic || !epic.project_id) return null;

  // menu items
  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link",
      icon: LinkIcon,
      shouldRender: true,
    },
    {
      key: "remove",
      action: () => removeEpicFromInitiative(workspaceSlug, initiativeId, epic?.id),
      title: "Remove",
      icon: Trash2,
      shouldRender: !disabled,
    },
  ];

  return (
    <>
      <CustomMenu
        customButton={
          <span className="grid place-items-center p-0.5  rounded my-auto">
            <MoreHorizontal className="size-4" />
          </span>
        }
        className={cn("flex justify-center items-center pointer-events-auto flex-shrink-0 my-auto rounded  ")}
        customButtonClassName="grid place-items-center"
        placement="bottom-start"
      >
        {MENU_ITEMS.filter((item) => item.shouldRender).map((item) => (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              item.action();
            }}
          >
            <div className="flex items-center justify-start gap-2">
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <span>{item.title}</span>
            </div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
});
