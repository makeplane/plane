"use client";

import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { BarChart2, Briefcase, Layers } from "lucide-react";
import { Disclosure, Transition } from "@headlessui/react";
// ui
import { EUserWorkspaceRoles } from "@plane/constants";
import { ContrastIcon } from "@plane/ui";
// components
import { SidebarWorkspaceMenuHeader, SidebarWorkspaceMenuItem } from "@/components/workspace/sidebar";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useAppTheme } from "@/hooks/store";
import useLocalStorage from "@/hooks/use-local-storage";

export const SidebarWorkspaceMenu = observer(() => {
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  // local storage
  const { setValue: toggleWorkspaceMenu, storedValue } = useLocalStorage<boolean>("is_workspace_menu_open", true);
  // derived values
  const isWorkspaceMenuOpen = !!storedValue;

  useEffect(() => {
    if (sidebarCollapsed) toggleWorkspaceMenu(true);
  }, [sidebarCollapsed, toggleWorkspaceMenu]);

  const SIDEBAR_WORKSPACE_MENU_ITEMS = [
    {
      key: "projects",
      labelTranslationKey: "projects",
      href: `/${workspaceSlug}/projects/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
      Icon: Briefcase,
    },
    {
      key: "views",
      labelTranslationKey: "views",
      href: `/${workspaceSlug}/workspace-views/all-issues/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER, EUserWorkspaceRoles.GUEST],
      Icon: Layers,
    },
    {
      key: "active-cycles",
      labelTranslationKey: "cycles",
      href: `/${workspaceSlug}/active-cycles/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
      Icon: ContrastIcon,
    },
    {
      key: "analytics",
      labelTranslationKey: "analytics",
      href: `/${workspaceSlug}/analytics/`,
      access: [EUserWorkspaceRoles.ADMIN, EUserWorkspaceRoles.MEMBER],
      Icon: BarChart2,
    },
  ];

  return (
    <Disclosure as="div" defaultOpen>
      <SidebarWorkspaceMenuHeader isWorkspaceMenuOpen={isWorkspaceMenuOpen} toggleWorkspaceMenu={toggleWorkspaceMenu} />
      <Transition
        show={isWorkspaceMenuOpen}
        enter="transition duration-100 ease-out"
        enterFrom="transform scale-95 opacity-0"
        enterTo="transform scale-100 opacity-100"
        leave="transition duration-75 ease-out"
        leaveFrom="transform scale-100 opacity-100"
        leaveTo="transform scale-95 opacity-0"
      >
        {isWorkspaceMenuOpen && (
          <Disclosure.Panel
            as="div"
            className={cn("flex flex-col mt-0.5 gap-0.5", {
              "space-y-0 mt-0 ml-0": sidebarCollapsed,
            })}
            static
          >
            {SIDEBAR_WORKSPACE_MENU_ITEMS.map((item) => (
              <SidebarWorkspaceMenuItem key={item.key} item={item} />
            ))}
          </Disclosure.Panel>
        )}
      </Transition>
    </Disclosure>
  );
});
