/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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

export const SwitchAccountDropdown = observer(function SwitchAccountDropdown(props: TSwitchAccountDropdownProps) {
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
        <Menu.Button className="z-10 flex items-center gap-x-2.5 rounded-lg bg-layer-1 px-2 py-1.5">
          <div className="flex size-6 items-center justify-center rounded-full bg-success-primary text-13 font-semibold text-on-color capitalize">
            {user?.avatar_url ? (
              <img
                src={getFileURL(user?.avatar_url)}
                alt={user?.display_name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <>{fullName?.[0] ?? "R"}</>
            )}
          </div>
          <span className="text-13 font-medium text-secondary">{displayName}</span>
        </Menu.Button>
        <Transition
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 min-w-[12rem] rounded-md border-[0.5px] border-strong bg-surface-1 px-2 py-2.5 text-13 shadow-raised-200">
            <Menu.Item
              as="button"
              type="button"
              className={({ active }) =>
                cn("w-full rounded-sm px-1 py-1.5 text-left whitespace-nowrap text-danger-primary", {
                  "bg-layer-1": active,
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
