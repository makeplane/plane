import { FC } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
// ui
import { Avatar } from "@plane/ui";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
// store
import { useUser } from "hooks/store";

export type OnboardingHeaderProps = {
  fullName: string;
  step: number;
  setShowDeleteAccountModal: any;
};

export const OnboardingHeader: FC<OnboardingHeaderProps> = (props) => {
  const { fullName, step, setShowDeleteAccountModal } = props;
  // store hooks
  const { data: user } = useUser();

  return (
    <div className="flex items-center px-4 py-10 sm:px-7 sm:pb-8 sm:pt-14 md:px-14 lg:pl-28 lg:pr-24">
      <div className="flex w-full items-center justify-between font-semibold ">
        <div className="flex items-center gap-x-1 text-3xl">
          <Image src={BluePlaneLogoWithoutText} alt="Plane Logo" height={30} width={30} />
          Plane
        </div>

        <div>
          <div className="flex items-center gap-x-2 pr-4">
            {step != 1 && user?.avatar && (
              <Avatar
                name={
                  user?.first_name
                    ? `${user?.first_name} ${user?.last_name ?? ""}`
                    : fullName.length > 0
                    ? fullName
                    : user?.email
                }
                src={user?.avatar}
                size={35}
                shape="square"
                fallbackBackgroundColor="#FCBE1D"
                className="!text-base capitalize"
              />
            )}
            <div>
              {step != 1 && (
                <p className="text-sm font-medium text-custom-text-200">
                  {user?.first_name
                    ? `${user?.first_name} ${user?.last_name ?? ""}`
                    : fullName.length > 0
                    ? fullName
                    : null}
                </p>
              )}

              <Menu>
                <Menu.Button className={"flex items-center gap-x-2"}>
                  <span className="text-base font-medium">{user?.email}</span>
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
                  <Menu.Items className={"absolute min-w-full"}>
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
      </div>
    </div>
  );
};
