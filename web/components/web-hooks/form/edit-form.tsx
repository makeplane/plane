import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@plane/ui";

interface IWebHookEditForm {
  setOpenDeleteModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const WebHookEditForm = ({ setOpenDeleteModal }: IWebHookEditForm) => (
  <Disclosure as="div" className="border-t border-custom-border-200">
    {({ open }) => (
      <div className="w-full">
        <Disclosure.Button as="button" type="button" className="flex items-center justify-between w-full py-4">
          <span className="text-lg tracking-tight">Danger Zone</span>
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </Disclosure.Button>

        <Transition
          show={open}
          enter="transition duration-100 ease-out"
          enterFrom="transform opacity-0"
          enterTo="transform opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform opacity-100"
          leaveTo="transform opacity-0"
        >
          <Disclosure.Panel>
            <div className="flex flex-col gap-8">
              <span className="text-sm tracking-tight">
                The danger zone of the workspace delete page is a critical area that requires careful consideration and
                attention. When deleting a workspace, all of the data and resources within that workspace will be
                permanently removed and cannot be recovered.
              </span>
              <div>
                <Button
                  variant="danger"
                  onClick={() => {
                    setOpenDeleteModal(true);
                  }}
                >
                  Delete Webhook
                </Button>
              </div>
            </div>
          </Disclosure.Panel>
        </Transition>
      </div>
    )}
  </Disclosure>
);
