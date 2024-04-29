import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
// ui
import { Avatar } from "@plane/ui";
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

  return (
    <div className="flex w-full shrink-0 justify-end">
      <SwitchOrDeleteAccountModal isOpen={showDeleteAccountModal} onClose={() => setShowDeleteAccountModal(false)} />
      <div className="flex items-center gap-x-2 pr-4">
        {user?.avatar && (
          <Avatar
            name={
              user?.first_name
                ? `${user?.first_name} ${user?.last_name ?? ""}`
                : fullName && fullName.trim().length > 0
                  ? fullName
                  : user?.email
            }
            src={user?.avatar}
            size={24}
            shape="square"
            fallbackBackgroundColor="#FCBE1D"
            className="!text-base capitalize"
          />
        )}
        <div>
          <Menu>
            <Menu.Button className={"flex items-center gap-x-1"}>
              <span className="text-sm font-medium">
                <p className="text-sm font-medium text-custom-text-200">
                  {user?.first_name
                    ? `${user?.first_name} ${user?.last_name ?? ""}`
                    : fullName && fullName.trim().length > 0
                      ? fullName
                      : user?.email}
                </p>
              </span>
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
              <Menu.Items className={"absolute min-w-fit"}>
                <Menu.Item as="div">
                  <div
                    className="mr-auto mt-2 rounded-md border border-red-400 bg-onboarding-background-200 p-3 text-base font-normal text-red-400 shadow-sm hover:cursor-pointer"
                    onClick={() => {
                      setShowDeleteAccountModal(true);
                    }}
                  >
                    Wrong e-mail address?
                  </div>
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
});
