/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
    <div className="group/workspace-button mt-2.5 flex rounded-sm bg-surface-1 px-2 hover:bg-surface-2">
      <Disclosure.Button
        as="button"
        className="sticky top-0 z-10 flex w-full flex-1 items-center justify-between gap-1 py-1.5 text-13 font-semibold text-placeholder"
        onClick={() => toggleWorkspaceMenu(!isWorkspaceMenuOpen)}
      >
        <span>{t("workspace")}</span>
      </Disclosure.Button>
      <CustomMenu
        customButton={
          <span
            ref={actionSectionRef}
            className="my-auto grid place-items-center rounded-sm p-0.5 text-placeholder hover:bg-layer-1"
            onClick={() => {
              setIsMenuActive(!isMenuActive);
            }}
          >
            <MoreHorizontal className="size-4" />
          </span>
        }
        className={cn(
          "pointer-events-none z-20 my-auto flex h-full flex-shrink-0 items-center opacity-0 group-hover/workspace-button:pointer-events-auto group-hover/workspace-button:opacity-100",
          {
            "pointer-events-auto opacity-100": isMenuActive,
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
        className="group/workspace-button sticky top-0 z-10 flex items-center justify-between gap-1 rounded-sm px-0.5 py-1.5 text-11 font-semibold text-placeholder hover:bg-surface-2"
        onClick={() => toggleWorkspaceMenu(!isWorkspaceMenuOpen)}
      >
        {" "}
        <span className="pointer-events-none flex-shrink-0 rounded-sm opacity-0 group-hover/workspace-button:pointer-events-auto group-hover/workspace-button:opacity-100 hover:bg-layer-1">
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
