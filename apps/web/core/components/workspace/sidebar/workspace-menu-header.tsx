import { FC, useState, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MoreHorizontal, ArchiveIcon, ChevronRight, Settings } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { EUserWorkspaceRoles } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// store hooks
import { useUserPermissions } from "@/hooks/store";

export type SidebarWorkspaceMenuHeaderProps = {
  isWorkspaceMenuOpen: boolean;
  toggleWorkspaceMenu: (value: boolean) => void;
};

export const SidebarWorkspaceMenuHeader: FC<SidebarWorkspaceMenuHeaderProps> = observer((props) => {
  const { isWorkspaceMenuOpen, toggleWorkspaceMenu } = props;
  // state
  const [isMenuActive, setIsMenuActive] = useState(false);
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  // hooks
  const { workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  // TODO: fix types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN] as any, EUserPermissionsLevel.WORKSPACE);

  return (
    <div className="flex px-2 bg-custom-sidebar-background-100 group/workspace-button hover:bg-custom-sidebar-background-90 rounded mt-2.5">
      <Disclosure.Button
        as="button"
        className="flex-1 sticky top-0  z-10  w-full  py-1.5 flex items-center justify-between gap-1 text-custom-sidebar-text-400  text-sm font-semibold"
        onClick={() => toggleWorkspaceMenu(!isWorkspaceMenuOpen)}
      >
        <span>{t("workspace")}</span>
      </Disclosure.Button>
      <CustomMenu
        customButton={
          <span
            ref={actionSectionRef}
            className="grid place-items-center p-0.5 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-80 rounded my-auto"
            onClick={() => {
              setIsMenuActive(!isMenuActive);
            }}
          >
            <MoreHorizontal className="size-4" />
          </span>
        }
        className={cn(
          "h-full flex items-center opacity-0 z-20 pointer-events-none flex-shrink-0 group-hover/workspace-button:opacity-100 group-hover/workspace-button:pointer-events-auto my-auto",
          {
            "opacity-100 pointer-events-auto": isMenuActive,
          }
        )}
        customButtonClassName="grid place-items-center"
        placement="bottom-start"
      >
        <CustomMenu.MenuItem>
          <Link href={`/${workspaceSlug}/projects/archives`}>
            <div className="flex items-center justify-start gap-2">
              <ArchiveIcon className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>{t("archives")}</span>
            </div>
          </Link>
        </CustomMenu.MenuItem>

        {isAdmin && (
          <CustomMenu.MenuItem>
            <Link href={`/${workspaceSlug}/settings`}>
              <div className="flex items-center justify-start gap-2">
                <Settings className="h-3.5 w-3.5 stroke-[1.5]" />
                <span>{t("settings")}</span>
              </div>
            </Link>
          </CustomMenu.MenuItem>
        )}
      </CustomMenu>
      <Disclosure.Button
        as="button"
        className="sticky top-0 z-10 group/workspace-button px-0.5 py-1.5 flex items-center justify-between gap-1 text-custom-sidebar-text-400 hover:bg-custom-sidebar-background-90 rounded text-xs font-semibold"
        onClick={() => toggleWorkspaceMenu(!isWorkspaceMenuOpen)}
      >
        {" "}
        <span className="flex-shrink-0 opacity-0 pointer-events-none group-hover/workspace-button:opacity-100 group-hover/workspace-button:pointer-events-auto rounded hover:bg-custom-sidebar-background-80">
          <ChevronRight
            className={cn("size-4 flex-shrink-0 text-custom-sidebar-text-400 transition-transform", {
              "rotate-90": isWorkspaceMenuOpen,
            })}
          />
        </span>
      </Disclosure.Button>
    </div>
  );
});
