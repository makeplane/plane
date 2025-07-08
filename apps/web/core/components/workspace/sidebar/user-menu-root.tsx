"use client";

import { Fragment, Ref, useState, useEffect } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { usePopper } from "react-popper";
// icons
import { LogOut, PanelLeftDashed, Settings } from "lucide-react";
// ui
import { Menu, Transition } from "@headlessui/react";
// plane imports
import { GOD_MODE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Avatar, TOAST_TYPE, setToast } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useAppTheme, useUser } from "@/hooks/store";
import { useAppRail } from "@/hooks/use-app-rail";

type Props = {
  size?: "sm" | "md";
};

export const UserMenuRoot = observer((props: Props) => {
  const { size = "sm" } = props;
  const { workspaceSlug } = useParams();
  // store hooks
  const { toggleAnySidebarDropdown, sidebarPeek, toggleSidebarPeek } = useAppTheme();

  const { isEnabled, shouldRenderAppRail, toggleAppRail } = useAppRail();
  const { data: currentUser } = useUser();
  const { signOut } = useUser();
  // derived values

  const isUserInstanceAdmin = false;
  // translation
  const { t } = useTranslation();
  // local state
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  // popper-js refs
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // popper-js init
  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "right",
    modifiers: [{ name: "preventOverflow", options: { padding: 12 } }],
  });

  const handleSignOut = async () => {
    await signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("sign_out.toast.error.title"),
        message: t("sign_out.toast.error.message"),
      })
    );
  };

  // Toggle sidebar dropdown state when either menu is open
  useEffect(() => {
    if (isUserMenuOpen) toggleAnySidebarDropdown(true);
    else toggleAnySidebarDropdown(false);
  }, [isUserMenuOpen]);

  return (
    <Menu as="div" className="relative flex-shrink-0">
      {({ open, close }: { open: boolean; close: () => void }) => {
        // Update local state directly
        if (isUserMenuOpen !== open) {
          setIsUserMenuOpen(open);
        }

        return (
          <>
            <Menu.Button
              className="grid place-items-center outline-none"
              ref={setReferenceElement}
              aria-label={t("aria_labels.projects_sidebar.open_user_menu")}
            >
              <Avatar
                name={currentUser?.display_name}
                src={getFileURL(currentUser?.avatar_url ?? "")}
                size={size === "sm" ? 24 : 28}
                shape="circle"
                className="!text-base"
              />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className="absolute left-0 z-[21] mt-1 flex w-44 origin-top-left flex-col divide-y
              divide-custom-sidebar-border-200 rounded-md border border-custom-sidebar-border-200 bg-custom-sidebar-background-100 px-1 py-2 text-xs shadow-lg outline-none"
                ref={setPopperElement as Ref<HTMLDivElement>}
                style={styles.popper}
                {...attributes.popper}
              >
                <div className="flex flex-col gap-2.5 pb-2">
                  <span className="px-2 text-custom-sidebar-text-200">{currentUser?.email}</span>
                  <Link href={`/${workspaceSlug}/settings/account`}>
                    <Menu.Item as="div">
                      <span className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80">
                        <Settings className="h-4 w-4 stroke-[1.5]" />
                        <span>{t("settings")}</span>
                      </span>
                    </Menu.Item>
                  </Link>
                  {isEnabled && (
                    <Menu.Item
                      as="button"
                      type="button"
                      className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80"
                      onClick={() => {
                        if (sidebarPeek) toggleSidebarPeek(false);
                        toggleAppRail();
                      }}
                    >
                      <PanelLeftDashed className="h-4 w-4 stroke-[1.5]" />
                      <span>{shouldRenderAppRail ? "Undock AppRail" : "Dock AppRail"}</span>
                    </Menu.Item>
                  )}
                </div>
                <div className={`pt-2 ${isUserInstanceAdmin || false ? "pb-2" : ""}`}>
                  <Menu.Item
                    as="button"
                    type="button"
                    className="flex w-full items-center gap-2 rounded px-2 py-1 hover:bg-custom-sidebar-background-80"
                    onClick={handleSignOut}
                  >
                    <LogOut className="size-4 stroke-[1.5]" />
                    {t("sign_out")}
                  </Menu.Item>
                </div>
                {isUserInstanceAdmin && (
                  <div className="p-2 pb-0">
                    <Link href={GOD_MODE_URL}>
                      <Menu.Item as="button" type="button" className="w-full">
                        <span className="flex w-full items-center justify-center rounded bg-custom-primary-100/20 px-2 py-1 text-sm font-medium text-custom-primary-100 hover:bg-custom-primary-100/30 hover:text-custom-primary-200">
                          {t("enter_god_mode")}
                        </span>
                      </Menu.Item>
                    </Link>
                  </div>
                )}
              </Menu.Items>
            </Transition>
          </>
        );
      }}
    </Menu>
  );
});
