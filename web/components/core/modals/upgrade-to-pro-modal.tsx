import { Fragment } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Check, Crown, X } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// ui
import { Button, getButtonStyling } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// assets
import DarkMainImage from "@/public/upgrade-to-pro-modal/main-dark.svg";
import LightMainImage from "@/public/upgrade-to-pro-modal/main-light.svg";
import DarkOverlayImage from "@/public/upgrade-to-pro-modal/overlay-dark.svg";
import LightOverlayImage from "@/public/upgrade-to-pro-modal/overlay-light.svg";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const PRO_FEATURES_LIST = [
  "Bulk transfer issues between projects.",
  "Manage issue subscriptions in bulk.",
  "Change cycles, modules and many more\nproperties at once.",
];

export const UpgradeToProModal: React.FC<Props> = (props) => {
  const { isOpen, onClose } = props;
  // next-themes
  const { resolvedTheme } = useTheme();

  const handleClose = () => {
    onClose();
  };

  const mainImage = resolvedTheme === "light" ? LightMainImage : DarkMainImage;
  const overlayImage = resolvedTheme === "light" ? LightOverlayImage : DarkOverlayImage;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-20" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-20 overflow-y-auto">
          <div className="grid place-items-center p-4 min-h-full">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={cn(
                  "relative transform rounded-xl bg-custom-background-100 text-left shadow-custom-shadow-md transition-all w-full md:w-[95%] lg:w-3/4 grid grid-cols-2 bg-gradient-to-l overflow-hidden",
                  {
                    "from-[#3b5ec6] to-[#f5f7fe]": resolvedTheme === "light",
                    "from-[#212121] from-0% via-[#505050] via-70% to-[#212121] to-100%": resolvedTheme === "dark",
                  }
                )}
              >
                <button
                  type="button"
                  className="absolute top-6 right-5 z-[1] grid place-items-center"
                  onClick={handleClose}
                >
                  <X className="size-6 text-white" />
                </button>
                <div className="p-12 pr-4">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-3xl">
                      Act faster on multiple issues at once with additional powers
                    </h4>
                    <div className="space-y-5">
                      {PRO_FEATURES_LIST.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3 text-custom-text-200">
                          <span>
                            <Check className="size-5" />
                          </span>
                          <p className="text-base font-medium whitespace-pre-line">{feature}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-base font-medium text-custom-text-200">
                      All features within bulk operations are available in our Pro plan and above. Upgrade now to boost
                      productivity.
                    </p>
                  </div>
                  <div className="mt-7 flex items-center gap-3">
                    <a
                      href="https://plane.so/pricing"
                      className={cn(getButtonStyling("primary", "md"), "flex items-center")}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Crown className="size-3.5" />
                      Upgrade
                    </a>
                    <a
                      href="https://plane.so/contact"
                      className={cn("text-custom-primary-100 underline font-medium text-base", {
                        "text-custom-text-100": resolvedTheme === "dark",
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Talk custom pricing
                    </a>
                  </div>
                </div>
                <div className="relative grid place-items-end">
                  <div className="h-4/5 grid place-items-end">
                    <Image src={mainImage} className="rounded-tl-lg rounded-br-xl" alt="Upgrade to Pro main image" />
                  </div>
                  <div className="absolute right-1 bottom-1">
                    <Image src={overlayImage} className="size-full" alt="Upgrade to Pro overlay image" />
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};
