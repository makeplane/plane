"use client";

import type { FC } from "react";
import { useState } from "react";
import { observer } from "mobx-react";
import { Menu, Transition } from "@headlessui/react";
// ui
import { cn, getFileURL } from "@plane/utils";
// helpers
// hooks
import { useUser } from "@/hooks/store/user";
// components
import { SwitchAccountModal } from "./switch-account-modal";

type TSwitchAccountDropdownProps = {
  fullName?: string;
};

export const SwitchAccountDropdown: FC<TSwitchAccountDropdownProps> = observer((props) => {
  const { fullName } = props;
  // states
  const [showSwitchAccountModal, setShowSwitchAccountModal] = useState(false);
  // store hooks
  const { data: user } = useUser();

  const displayName = user?.first_name
    ? `${user?.first_name} ${user?.last_name ?? ""}`
    : fullName && fullName.trim().length > 0
      ? fullName
      : user?.email;

  if (!displayName && !fullName) return null;

  return (
    <>
      <SwitchAccountModal isOpen={showSwitchAccountModal} onClose={() => setShowSwitchAccountModal(false)} />
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center gap-x-2.5 px-2 py-1.5 rounded-lg bg-custom-background-90 z-10">
          <div className="size-6 rounded-full bg-green-700 flex items-center justify-center text-white font-semibold text-sm capitalize">
            {user?.avatar_url ? (
              <img
                src={getFileURL(user?.avatar_url)}
                alt={user?.display_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <>{fullName?.[0] ?? "R"}</>
            )}
          </div>
          <span className="text-sm font-medium text-custom-text-200">{displayName}</span>
        </Menu.Button>
        <Transition
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Menu.Items className="absolute z-10 right-0 rounded-md border-[0.5px] border-custom-border-300 mt-2 bg-custom-background-100 px-2 py-2.5 text-sm min-w-[12rem] shadow-custom-shadow-rg">
            <Menu.Item
              as="button"
              type="button"
              className={({ active }) =>
                cn("text-red-500 px-1 py-1.5 whitespace-nowrap text-left rounded w-full", {
                  "bg-custom-background-80": active,
                })
              }
              onClick={() => setShowSwitchAccountModal(true)}
            >
              Wrong e-mail address?
            </Menu.Item>
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
});
