import { LinkIcon, MoreHorizontal, Trash2 } from "lucide-react";
import { observer } from "mobx-react";
// Plane
import { cn } from "@plane/utils";
import { CustomMenu, setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
// helpers
import { copyUrlToClipboard } from "@/helpers/string.helper";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TProject } from "@/plane-web/types/projects";

type Props = {
  workspaceSlug: string;
  project: TProject;
  initiativeId: string;
};

export const QuickActions: React.FC<Props> = observer((props: Props) => {
  const { workspaceSlug, initiativeId, project } = props;
  // derived states
  const projectLink = `${workspaceSlug}/projects/${project.id}/issues`;

  const {
    initiative: { updateInitiative },
  } = useInitiatives();

  const handleCopyText = () =>
    copyUrlToClipboard(projectLink).then(() =>
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Link Copied!",
        message: "Project link copied to clipboard.",
      })
    );

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
      action: () => updateInitiative(workspaceSlug, initiativeId, { project_ids: [project.id] }),
      title: "Remove",
      icon: Trash2,
      shouldRender: true,
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
