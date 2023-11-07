import React from "react";
import { observer } from "mobx-react-lite";
import { Listbox, Transition } from "@headlessui/react";
import { MoveRight } from "lucide-react";
// hooks
import useToast from "hooks/use-toast";
// ui
import { Icon } from "components/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// store
import { IPeekMode } from "store/issue_details";
import { RootStore } from "store/root";
// lib
import { useMobxStore } from "lib/mobx/store-provider";
// types
import { IIssue } from "types/issue";

type Props = {
  handleClose: () => void;
  issueDetails: IIssue | undefined;
};

const peekModes: {
  key: IPeekMode;
  icon: string;
  label: string;
}[] = [
  { key: "side", icon: "side_navigation", label: "Side Peek" },
  {
    key: "modal",
    icon: "dialogs",
    label: "Modal Peek",
  },
  {
    key: "full",
    icon: "nearby",
    label: "Full Screen Peek",
  },
];

export const PeekOverviewHeader: React.FC<Props> = observer((props) => {
  const { handleClose } = props;

  const { issueDetails: issueDetailStore }: RootStore = useMobxStore();

  const { setToastAlert } = useToast();

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToastAlert({
        type: "success",
        title: "Link copied!",
        message: "Issue link copied to clipboard",
      });
    });
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {issueDetailStore.peekMode === "side" && (
            <button type="button" onClick={handleClose}>
              <MoveRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
          <Listbox
            as="div"
            value={issueDetailStore.peekMode}
            onChange={(val) => issueDetailStore.setPeekMode(val)}
            className="relative flex-shrink-0 text-left"
          >
            <Listbox.Button
              className={`grid place-items-center ${issueDetailStore.peekMode === "full" ? "rotate-45" : ""}`}
            >
              <Icon iconName={peekModes.find((m) => m.key === issueDetailStore.peekMode)?.icon ?? ""} />
            </Listbox.Button>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Listbox.Options className="absolute z-10 border border-custom-border-300 mt-1 overflow-y-auto rounded-md bg-custom-background-90 text-xs shadow-lg focus:outline-none left-0 origin-top-left min-w-[8rem] whitespace-nowrap">
                <div className="space-y-1 p-2">
                  {peekModes.map((mode) => (
                    <Listbox.Option
                      key={mode.key}
                      value={mode.key}
                      className={({ active, selected }) =>
                        `cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                          active || selected ? "bg-custom-background-80" : ""
                        } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                      }
                    >
                      {({ selected }) => (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <Icon
                                iconName={mode.icon}
                                className={`!text-base flex-shrink-0 -my-1 ${mode.key === "full" ? "rotate-45" : ""}`}
                              />
                              {mode.label}
                            </div>
                          </div>
                          {selected && <Icon iconName="done" />}
                        </div>
                      )}
                    </Listbox.Option>
                  ))}
                </div>
              </Listbox.Options>
            </Transition>
          </Listbox>
        </div>
        {(issueDetailStore.peekMode === "side" || issueDetailStore.peekMode === "modal") && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button type="button" onClick={handleCopyLink} className="-rotate-45 focus:outline-none" tabIndex={1}>
              <Icon iconName="link" />
            </button>
          </div>
        )}
      </div>
    </>
  );
});
