import { useState, useRef } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { MoreHorizontal, ArchiveIcon, Settings } from "lucide-react";
import { Disclosure } from "@headlessui/react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useOutsideClickDetector } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
import { EUserWorkspaceRoles } from "@plane/types";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// store hooks
import { useUserPermissions } from "@/hooks/store/user";

export type SidebarWorkspaceMenuHeaderProps = {
  isWorkspaceMenuOpen: boolean;
  toggleWorkspaceMenu: (value: boolean) => void;
};

export const SidebarWorkspaceMenuHeader = observer(function SidebarWorkspaceMenuHeader(
  props: SidebarWorkspaceMenuHeaderProps
) {
  const { isWorkspaceMenuOpen, toggleWorkspaceMenu } = props;
  // state
  const [isMenuActive, setIsMenuActive] = useState(false);
  // refs
  const actionSectionRef = useRef<HTMLDivElement | null>(null);
  // hooks
  const { workspaceSlug } = useParams();
  const router = useRouter();
  const { allowPermissions } = useUserPermissions();
  const { t } = useTranslation();

  useOutsideClickDetector(actionSectionRef, () => setIsMenuActive(false));

  // TODO: fix types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = allowPermissions([EUserWorkspaceRoles.ADMIN] as any, EUserPermissionsLevel.WORKSPACE);

  return (
    <div className="flex px-2 bg-surface-1 group/workspace-button hover:bg-surface-2 rounded-sm mt-2.5">
      <Disclosure.Button
        as="button"
        className="flex-1 sticky top-0  z-10  w-full  py-1.5 flex items-center justify-between gap-1 text-placeholder  text-13 font-semibold"
        onClick={() => toggleWorkspaceMenu(!isWorkspaceMenuOpen)}
      >
        <span>{t("workspace")}</span>
      </Disclosure.Button>
      <CustomMenu
        customButton={
          <span
            ref={actionSectionRef}
            className="grid place-items-center p-0.5 text-placeholder hover:bg-layer-1 rounded-sm my-auto"
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
        <CustomMenu.MenuItem onClick={() => router.push(`/${workspaceSlug}/projects/archives`)}>
          <div className="flex items-center justify-start gap-2">
            <ArchiveIcon className="h-3.5 w-3.5 stroke-[1.5]" />
            <span>{t("archives")}</span>
          </div>
        </CustomMenu.MenuItem>

        {isAdmin && (
          <CustomMenu.MenuItem onClick={() => router.push(`/${workspaceSlug}/settings`)}>
            <div className="flex items-center justify-start gap-2">
              <Settings className="h-3.5 w-3.5 stroke-[1.5]" />
              <span>{t("settings")}</span>
            </div>
          </CustomMenu.MenuItem>
        )}
      </CustomMenu>
      <Disclosure.Button
        as="button"
        className="sticky top-0 z-10 group/workspace-button px-0.5 py-1.5 flex items-center justify-between gap-1 text-placeholder hover:bg-surface-2 rounded-sm text-11 font-semibold"
        onClick={() => toggleWorkspaceMenu(!isWorkspaceMenuOpen)}
      >
        {" "}
        <span className="flex-shrink-0 opacity-0 pointer-events-none group-hover/workspace-button:opacity-100 group-hover/workspace-button:pointer-events-auto rounded-sm hover:bg-layer-1">
          <ChevronRightIcon
            className={cn("size-4 flex-shrink-0 text-placeholder transition-transform", {
              "rotate-90": isWorkspaceMenuOpen,
            })}
          />
        </span>
      </Disclosure.Button>
    </div>
  );
});
