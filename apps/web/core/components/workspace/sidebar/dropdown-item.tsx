import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Settings, UserPlus } from "lucide-react";
import { Menu } from "@headlessui/react";
// plane imports
import { EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CheckIcon } from "@plane/propel/icons";
import type { IWorkspace } from "@plane/types";
import { cn, getFileURL, getUserRole } from "@plane/utils";
// plane web imports
import { SubscriptionPill } from "@/plane-web/components/common/subscription/subscription-pill";

type TProps = {
  workspace: IWorkspace;
  activeWorkspace: IWorkspace | null;
  handleItemClick: () => void;
  handleWorkspaceNavigation: (workspace: IWorkspace) => void;
  handleClose: () => void;
};
const SidebarDropdownItem = observer(function SidebarDropdownItem(props: TProps) {
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
          "bg-layer-transparent-active": workspace.id === activeWorkspace?.id,
          "hover:bg-layer-transparent-hover": workspace.id !== activeWorkspace?.id,
        })}
      >
        <div className="flex items-center justify-between gap-1 rounded-sm p-1 text-13 text-primary ">
          <div className="flex items-center justify-start gap-2.5 w-[80%] relative">
            <span
              className={`relative flex h-8 w-8 flex-shrink-0 items-center  justify-center p-2 text-14 uppercase font-medium border-subtle ${
                !workspace?.logo_url && "rounded-md bg-[#026292] text-on-color"
              }`}
            >
              {workspace?.logo_url && workspace.logo_url !== "" ? (
                <img
                  src={getFileURL(workspace.logo_url)}
                  className="absolute left-0 top-0 h-full w-full rounded-sm object-cover"
                  alt={t("workspace_logo")}
                />
              ) : (
                (workspace?.name?.[0] ?? "...")
              )}
            </span>
            <div className="w-[inherit]">
              <div
                className={`truncate text-left text-ellipsis text-13 font-medium ${workspaceSlug === workspace.slug ? "" : "text-secondary"}`}
              >
                {workspace.name}
              </div>
              <div className="text-13 text-tertiary flex gap-2 capitalize w-fit">
                <span>{getUserRole(workspace.role)?.toLowerCase() || "guest"}</span>
                <div className="w-1 h-1 bg-layer-1/50 rounded-full m-auto" />
                <span className="capitalize">{t("member", { count: workspace.total_members || 0 })}</span>
              </div>
            </div>
          </div>
          {workspace.id === activeWorkspace?.id ? (
            <span className="flex-shrink-0 p-1">
              <CheckIcon className="h-5 w-5 text-primary" />
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="flex border border-strong rounded-md py-1.5 px-2.5 gap-1.5 hover:text-secondary text-secondary hover:border-strong bg-layer-2 hover:shadow-raised-100 transition-colors"
                >
                  <Settings className="h-4 w-4 my-auto flex-shrink-0" />
                  <span className="text-13 font-medium my-auto whitespace-nowrap">{t("settings")}</span>
                </Link>
              )}
              {[EUserPermissions.ADMIN].includes(workspace?.role) && (
                <Link
                  href={`/${workspace.slug}/settings/members`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                  }}
                  className="flex border border-strong rounded-md py-1.5 px-2.5 gap-1.5 hover:text-secondary text-secondary hover:border-strong bg-layer-2 hover:shadow-raised-100 transition-colors"
                >
                  <UserPlus className="h-4 w-4 my-auto flex-shrink-0" />
                  <span className="text-13 font-medium my-auto whitespace-nowrap">
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
