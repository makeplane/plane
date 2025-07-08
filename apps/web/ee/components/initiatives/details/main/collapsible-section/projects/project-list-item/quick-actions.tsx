import { observer } from "mobx-react";
import { LinkIcon, MoreHorizontal, Trash2 } from "lucide-react";
// Plane
import { useTranslation } from "@plane/i18n";
import { CustomMenu, setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
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
  // store hooks
  const {
    initiative: { updateInitiative, getInitiativeById },
  } = useInitiatives();
  const { t } = useTranslation();

  // derived states
  const projectLink = `${workspaceSlug}/projects/${project.id}/issues`;
  const initiative = getInitiativeById(initiativeId);

  // handler
  const handleCopyText = () =>
    copyUrlToClipboard(projectLink).then(() =>
      setToast({
        type: TOAST_TYPE.INFO,
        title: `${"common.link_copied"}!`,
        message: t("epics.project_link_copied_to_clipboard"),
      })
    );

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
    },
    {
      key: "remove",
      action: () =>
        updateInitiative(workspaceSlug, initiativeId, {
          project_ids: initiative?.project_ids ? initiative?.project_ids.filter((id) => id !== project.id) : [],
        }).then(async () => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: `You have removed the project ${project.name} from this initiative.`,
          });
        }),
      title: t("common.remove"),
      icon: Trash2,
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
        {MENU_ITEMS.map((item) => (
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
