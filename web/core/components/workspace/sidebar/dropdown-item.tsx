import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Settings, UserPlus } from "lucide-react";
import { Menu } from "@headlessui/react";
import { useTranslation } from "@plane/i18n";
import { IWorkspace } from "@plane/types";
import { cn, getFileURL } from "@plane/utils";

type TProps = {
  workspace: IWorkspace;
  activeWorkspace: IWorkspace | null;
  handleItemClick: () => void;
  handleWorkspaceNavigation: (workspace: IWorkspace) => void;
};
const SidebarDropdownItem = (props: TProps) => {
  const { workspace, activeWorkspace, handleItemClick, handleWorkspaceNavigation } = props;

  // router params
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();

  return (
    <Link
      key={workspace.id}
      href={`/${workspace.slug}`}
      onClick={() => {
        handleWorkspaceNavigation(workspace);
        handleItemClick();
      }}
      className="w-full"
    >
      <Menu.Item
        as="div"
        className={cn("px-4 py-2", {
          "bg-custom-primary-100/10": workspace.id === activeWorkspace?.id,
          "hover:bg-custom-sidebar-background-80": workspace.id !== activeWorkspace?.id,
        })}
      >
        <div className="flex items-center justify-between gap-1 rounded p-1 text-sm text-custom-sidebar-text-100 ">
          <div className="flex items-center justify-start gap-2.5 truncate">
            <span
              className={`relative flex h-8 w-8 flex-shrink-0 items-center  justify-center p-2 text-base uppercase font-semibold ${
                !workspace?.logo_url && "rounded-lg bg-custom-primary-500 text-white"
              }`}
            >
              {workspace?.logo_url && workspace.logo_url !== "" ? (
                <img
                  src={getFileURL(workspace.logo_url)}
                  className="absolute left-0 top-0 h-full w-full rounded-lg object-cover"
                  alt={t("workspace_logo")}
                />
              ) : (
                (workspace?.name?.[0] ?? "...")
              )}
            </span>
            <div>
              <h5
                className={`truncate text-base font-medium ${workspaceSlug === workspace.slug ? "" : "text-custom-text-200"}`}
              >
                {workspace.name}
              </h5>
              <div className="text-sm text-custom-text-300 flex gap-2">
                <span>Admin </span>
                <div className="w-1 h-1 bg-custom-text-300/50 rounded-full m-auto" />
                <span>
                  {workspace.total_members} {t("members", { count: workspace.total_members })}
                </span>
              </div>
            </div>
          </div>
          {workspace.id === activeWorkspace?.id ? (
            <span className="flex-shrink-0 p-1">
              <Check className="h-5 w-5 text-custom-sidebar-text-100" />
            </span>
          ) : (
            <div className="rounded bg-custom-background-80 px-2 py-[1px] text-xs font-medium text-custom-text-300">
              <h1>Free</h1>
            </div>
          )}
        </div>
        {workspace.id === activeWorkspace?.id && (
          <div className="mt-2 mb-1 flex gap-2">
            <Link
              href={`/${workspace.slug}/settings`}
              className="flex border border-custom-border-80 rounded-md py-1 px-2 gap-1 bg-custom-sidebar-background-100"
            >
              <Settings className="h-4 w-4 text-custom-sidebar-text-100 my-auto" />
              <span className="text-sm font-medium my-auto">{t("settings")}</span>
            </Link>
            <Link
              href={`/${workspace.slug}/settings/members`}
              className="flex border border-custom-border-80 rounded-md py-1 px-2 gap-1 bg-custom-sidebar-background-100"
            >
              <UserPlus className="h-4 w-4 text-custom-sidebar-text-100 my-auto" />
              <span className="text-sm font-medium my-auto capitalize">{t("invite")}</span>
            </Link>
          </div>
        )}
      </Menu.Item>
    </Link>
  );
};

export default SidebarDropdownItem;
