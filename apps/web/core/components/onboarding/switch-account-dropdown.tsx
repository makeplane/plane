"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
// ui
import { CustomMenu } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// helpers
// hooks
import { useUser } from "@/hooks/store";
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
      <CustomMenu
        customButtonClassName="flex items-center gap-x-2.5 px-2 py-1.5 rounded-lg bg-custom-background-90 z-10 w-max"
        customButton={
          <>
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
          </>
        }
      >
        <CustomMenu.MenuItem
          className="text-red-500 px-1 py-1.5 whitespace-nowrap text-left rounded w-full"
          onClick={() => setShowSwitchAccountModal(true)}
        >
          Wrong e-mail address?
        </CustomMenu.MenuItem>
      </CustomMenu>
    </>
  );
});
