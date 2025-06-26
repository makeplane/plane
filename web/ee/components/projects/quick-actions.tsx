import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArchiveRestoreIcon, LinkIcon, MoreHorizontal, Settings, Trash2 } from "lucide-react";
// plane imports
import { EUserProjectRoles } from "@plane/constants";
import { ArchiveIcon, CustomMenu, setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// components
import { ArchiveRestoreProjectModal, DeleteProjectModal, JoinProjectModal } from "@/components/project";
// plane web imports
import { TProject } from "@/plane-web/types/projects";

type Props = {
  workspaceSlug: string;
  project: TProject;
};
const QuickActions: React.FC<Props> = (props) => {
  const { workspaceSlug, project } = props;
  //states
  const [deleteProjectModalOpen, setDeleteProjectModal] = useState(false);
  const [joinProjectModalOpen, setJoinProjectModal] = useState(false);
  const [archiveRestoreProject, setArchiveRestoreProject] = useState(false);
  //router
  const router = useRouter();
  // derived states
  const projectLink = `${workspaceSlug}/projects/${project.id}/issues`;
  const isArchived = project.archived_at !== null;
  // auth
  const isOwner = project.member_role === EUserProjectRoles.ADMIN;
  const isMember = project.member_role === EUserProjectRoles.MEMBER;

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
      shouldRender: !isArchived,
    },
    {
      key: "restore",
      action: () => setArchiveRestoreProject(true),
      title: "Restore",
      icon: ArchiveRestoreIcon,
      shouldRender: isArchived && isOwner,
    },
    {
      key: "delete",
      action: () => setDeleteProjectModal(true),
      title: "Delete",
      icon: Trash2,
      shouldRender: isArchived && isOwner,
    },
    {
      key: "Archive",
      action: () => setArchiveRestoreProject(true),
      title: "Archive Project",
      icon: ArchiveIcon,
      shouldRender: isOwner && !isArchived,
    },
    {
      key: "settings",
      action: () => router.push(`/${workspaceSlug}/projects/${project.id}/settings`, {}),
      title: "Settings",
      icon: Settings,
      shouldRender: !isArchived && (isOwner || isMember),
    },
  ];
  return (
    <>
      {/* Delete Project Modal */}
      <DeleteProjectModal
        project={project}
        isOpen={deleteProjectModalOpen}
        onClose={() => setDeleteProjectModal(false)}
      />
      {/* Join Project Modal */}
      {workspaceSlug && (
        <JoinProjectModal
          workspaceSlug={workspaceSlug.toString()}
          project={project}
          isOpen={joinProjectModalOpen}
          handleClose={() => setJoinProjectModal(false)}
        />
      )}
      {/* Restore project modal */}
      {workspaceSlug && project && (
        <ArchiveRestoreProjectModal
          workspaceSlug={workspaceSlug.toString()}
          projectId={project.id}
          isOpen={archiveRestoreProject}
          onClose={() => setArchiveRestoreProject(false)}
          archive={!isArchived}
        />
      )}
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
            {["drafted-issues", "settings"].includes(item.key) ? (
              <Link
                href={`/${workspaceSlug}/projects/${project.id}/${item.key}`}
                className="flex items-center justify-start gap-2"
              >
                {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
                <span>{item.title}</span>
              </Link>
            ) : (
              <div className="flex items-center justify-start gap-2">
                {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
                <span>{item.title}</span>
              </div>
            )}
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
};

export default QuickActions;
