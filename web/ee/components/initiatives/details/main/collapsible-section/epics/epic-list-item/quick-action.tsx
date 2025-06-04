"use client";

import { observer } from "mobx-react";
import { LinkIcon, MoreHorizontal, Trash2 } from "lucide-react";
// Plane
import { EIssueServiceType } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CustomMenu, setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// helpers
import { generateWorkItemLink } from "@/helpers/issue.helper";
// hooks
import { useIssueDetail, useProject } from "@/hooks/store";
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
    initiative: {
      epics: { removeEpicFromInitiative },
    },
  } = useInitiatives();
  const {
    issue: { getIssueById },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const { getProjectIdentifierById } = useProject();

  const { t } = useTranslation();

  // derived values
  const epic = getIssueById(epicId);
  const projectIdentifier = getProjectIdentifierById(epic?.project_id);

  const workItemLink = generateWorkItemLink({
    workspaceSlug,
    projectId: epic?.project_id,
    issueId: epic?.id,
    projectIdentifier,
    sequenceId: epic?.sequence_id,
  });

  // handler
  const handleCopyText = () =>
    copyUrlToClipboard(workItemLink).then(() =>
      setToast({
        type: TOAST_TYPE.INFO,
        title: `${t("common.link_copied")}!`,
        message: t("epics.epic_link_copied_to_clipboard"),
      })
    );

  if (!epic || !epic.project_id) return null;

  // menu items
  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
      shouldRender: true,
    },
    {
      key: "remove",
      action: () =>
        removeEpicFromInitiative(workspaceSlug, initiativeId, epic?.id).then(async () => {
          setToast({
            title: "Success!",
            type: TOAST_TYPE.SUCCESS,
            message: `You have removed the epic ${projectIdentifier}-${epic?.sequence_id} from this initiative.`,
          });
        }),
      title: t("common.remove"),
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
