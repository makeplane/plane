"use client";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Settings, UserPlus } from "lucide-react";
// plane imports
import { Menu } from "@headlessui/react";
import { EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IWorkspace } from "@plane/types";
import { cn, getFileURL, getUserRole } from "@plane/utils";
// helpers
// plane web imports
import { SubscriptionPill } from "@/plane-web/components/common/subscription";

type TProps = {
  workspace: IWorkspace;
  activeWorkspace: IWorkspace | null;
  handleItemClick: () => void;
  handleWorkspaceNavigation: (workspace: IWorkspace) => void;
  handleClose: () => void;
};
const SidebarDropdownItem = observer((props: TProps) => {
  const { workspace, activeWorkspace, handleItemClick, handleWorkspaceNavigation, handleClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // hooks
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
      id={workspace.id}
    >
      <Menu.Item
        as="div"
        className={cn("px-4 py-2", {
          "bg-custom-sidebar-background-90": workspace.id === activeWorkspace?.id,
          "hover:bg-custom-sidebar-background-90": workspace.id !== activeWorkspace?.id,
        })}
      >
        <div className="flex items-center justify-between gap-1 rounded p-1 text-sm text-custom-sidebar-text-100 ">
          <div className="flex items-center justify-start gap-2.5 w-[80%] relative">
            <span
              className={`relative flex h-8 w-8 flex-shrink-0 items-center  justify-center p-2 text-base uppercase font-medium border-custom-border-200 ${
                !workspace?.logo_url && "rounded-md bg-custom-primary-500 text-white"
              }`}
            >
              {workspace?.logo_url && workspace.logo_url !== "" ? (
                <img
                  src={getFileURL(workspace.logo_url)}
                  className="absolute left-0 top-0 h-full w-full rounded object-cover"
                  alt={t("workspace_logo")}
                />
              ) : (
                (workspace?.name?.[0] ?? "...")
              )}
            </span>
            <div className="w-[inherit]">
              <div
                className={`truncate text-left text-ellipsis text-sm font-medium ${workspaceSlug === workspace.slug ? "" : "text-custom-text-200"}`}
              >
                {workspace.name}
              </div>
              <div className="text-sm text-custom-text-300 flex gap-2 capitalize w-fit">
                <span>{getUserRole(workspace.role)?.toLowerCase() || "guest"}</span>
                <div className="w-1 h-1 bg-custom-text-300/50 rounded-full m-auto" />
                <span className="capitalize">{t("member", { count: workspace.total_members || 0 })}</span>
              </div>
            </div>
          </div>
          {workspace.id === activeWorkspace?.id ? (
            <span className="flex-shrink-0 p-1">
              <Check className="h-5 w-5 text-custom-sidebar-text-100" />
            </span>
          ) : (
            <SubscriptionPill workspace={workspace} />
          )}
        </div>
        {workspace.id === activeWorkspace?.id && (
          <>
            <div className="mt-2 mb-1 flex gap-2">
              {[EUserPermissions.ADMIN, EUserPermissions.MEMBER].includes(workspace?.role) && (
                <Link
                  href={`/${workspace.slug}/settings`}
                  onClick={handleClose}
                  className="flex border border-custom-border-200 rounded-md py-1 px-2 gap-1 bg-custom-sidebar-background-100 hover:shadow-sm hover:text-custom-text-200 text-custom-text-300 hover:border-custom-border-300 "
                >
                  <Settings className="h-4 w-4 my-auto" />
                  <span className="text-sm font-medium my-auto">{t("settings")}</span>
                </Link>
              )}
              {[EUserPermissions.ADMIN].includes(workspace?.role) && (
                <Link
                  href={`/${workspace.slug}/settings/members`}
                  onClick={handleClose}
                  className="flex border border-custom-border-200 rounded-md py-1 px-2 gap-1 bg-custom-sidebar-background-100 hover:shadow-sm hover:text-custom-text-200 text-custom-text-300 hover:border-custom-border-300 "
                >
                  <UserPlus className="h-4 w-4 my-auto" />
                  <span className="text-sm font-medium my-auto">
                    {t("project_settings.members.invite_members.title")}
                  </span>
                </Link>
              )}
            </div>
          </>
        )}
      </Menu.Item>
    </Link>
  );
});

export default SidebarDropdownItem;
