import { FC, Fragment } from "react";
import { observer } from "mobx-react-lite";
import Image from "next/image";
import useSWR from "swr";
// ui
import { ExternalLink } from "lucide-react";
import { Dialog, Transition } from "@headlessui/react";
// types
import { IInstanceChangeLog } from "@plane/types";
// local components
import { MarkdownRenderer } from "@/components/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useInstance } from "@/hooks/store";
// assets
import PlaneOneLogo from "@/public/plane-logos/plane-one.svg";
// services
import { InstanceService } from "@/services/instance.service";

export type PlaneOneModalProps = {
  isOpen: boolean;
  handleClose: () => void;
};

export const PlaneOneModal: FC<PlaneOneModalProps> = observer((props) => {
  const { isOpen, handleClose } = props;
  // store
  const { instance, isUpdateAvailable } = useInstance();

  const instanceService = new InstanceService();

  const { data } = useSWR("INSTANCE_CHANGELOG", () => instanceService.getInstanceChangeLog());

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-custom-backdrop" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full pt-20 justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="flex flex-col w-full max-w-3xl max-h-[80vh] h-full transform overflow-hidden rounded-2xl bg-custom-background-100 text-left align-middle shadow-xl transition-all border-[0.5px] border-custom-border-100">
                <div className="flex gap-2 m-6 pb-4 items-center justify-between flex-shrink-0 border-0 border-b border-custom-border-100">
                  <div className="flex items-center gap-6">
                    <div className="flex gap-2 text-lg font-medium">
                      <Image src={PlaneOneLogo} alt="Plane One" width={36} height={36} />
                      Plane One
                    </div>
                    {instance?.current_version && <div className="text-sm font-medium">{instance.current_version}</div>}
                    {isUpdateAvailable ? (
                      <a
                        tabIndex={-1}
                        href="https://docs.plane.so/plane-one/self-host/manage/prime-cli"
                        className={cn(
                          "flex gap-1 items-center px-4 py-1 text-center text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-500 hover:text-yellow-600"
                        )}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Update available
                        <ExternalLink className="h-3 w-3" strokeWidth={2} />
                      </a>
                    ) : (
                      <div
                        className={cn(
                          "px-4 py-1 text-center text-xs font-medium rounded-full bg-custom-primary-100/20 text-custom-primary-100"
                        )}
                      >
                        LATEST
                      </div>
                    )}
                  </div>
                  <div className="cursor-default rounded-md bg-green-500/10 px-2 py-1 text-center text-xs font-medium text-green-500 outline-none leading-6">
                    Perpetual license
                  </div>
                </div>
                <div className="flex flex-col flex-grow vertical-scrollbar scrollbar-sm overflow-hidden overflow-y-scroll px-8">
                  {data &&
                    data.map((changelog: IInstanceChangeLog) => (
                      <div className="mb-4 pb-4 border-0 border-b border-custom-border-100" key={changelog?.version}>
                        <div className="flex item-center justify-between mb-4">
                          <h3 className="flex items-center text-xl font-bold">{changelog?.title}</h3>
                          <span className="text-sm flex items-center">
                            {changelog.release_date && new Date(changelog.release_date).toLocaleDateString()}
                          </span>
                        </div>
                        <MarkdownRenderer markdown={changelog?.description} />
                      </div>
                    ))}
                </div>
                <div className="flex items-center flex-shrink-0 gap-4 m-6">
                  <a
                    href="https://docs.plane.so/plane-one/introduction"
                    target="_blank"
                    className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
                  >
                    Docs
                  </a>
                  <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                    <circle cx={1} cy={1} r={1} />
                  </svg>
                  <a
                    href="https://plane.so/changelog/one"
                    target="_blank"
                    className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
                  >
                    Full Changelog
                  </a>
                  <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                    <circle cx={1} cy={1} r={1} />
                  </svg>
                  <a
                    href="mailto:support@plane.so"
                    target="_blank"
                    className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
                  >
                    Priority Support
                  </a>
                  <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                    <circle cx={1} cy={1} r={1} />
                  </svg>
                  <a
                    href="https://discord.com/invite/A92xrEGCge"
                    target="_blank"
                    className="text-sm text-custom-text-200 hover:text-custom-text-100 hover:underline underline-offset-1 outline-none"
                  >
                    Discord
                  </a>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
});
