import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
// ui
import { Avatar } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useUser } from "@/hooks/store";
// components
import { SwitchOrDeleteAccountModal } from "./switch-delete-account-modal";

type TSwithOrDeleteAccountDropdownProps = {
  fullName?: string;
};

export const SwitchOrDeleteAccountDropdown: FC<TSwithOrDeleteAccountDropdownProps> = observer((props) => {
  const { fullName } = props;
  // states
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  // store hooks
  const { data: user } = useUser();

  const displayName = user?.first_name
    ? `${user?.first_name} ${user?.last_name ?? ""}`
    : fullName && fullName.trim().length > 0
      ? fullName
      : user?.email;

  return (
    <div className="flex w-full shrink-0 justify-end">
      <SwitchOrDeleteAccountModal isOpen={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)} />
      <div className="flex items-center gap-x-2 pr-4 z-10">
        {user?.avatar && (
          <Avatar
            name={displayName}
            src={user?.avatar}
            size={24}
            shape="square"
            fallbackBackgroundColor="#FCBE1D"
            className="!text-base capitalize"
          />
        )}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-x-1 z-10">
            <span className="text-sm font-medium text-custom-text-200">{displayName}</span>
            <ChevronDown className="h-4 w-4 text-custom-text-300" />
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
                onClick={() => setShowDeleteAccountModal(true)}
              >
                Wrong e-mail address?
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
});
