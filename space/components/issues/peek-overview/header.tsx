import React from "react";
import { observer } from "mobx-react-lite";
import { MoveRight } from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
// ui
import { setToast, TOAST_TYPE } from "@plane/ui";
import { Icon } from "@/components/ui";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useIssueDetails } from "@/hooks/store";
import useClipboardWritePermission from "@/hooks/use-clipboard-write-permission";
// types
import { IIssue, IPeekMode } from "@/types/issue";

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

  const { peekMode, setPeekMode } = useIssueDetails();
  const isClipboardWriteAllowed = useClipboardWritePermission();

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Link copied!",
        message: "Issue link copied to clipboard",
      });
    });
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {peekMode === "side" && (
            <button type="button" onClick={handleClose}>
              <MoveRight className="h-4 w-4" strokeWidth={2} />
            </button>
          )}
          <Listbox
            as="div"
            value={peekMode}
            onChange={(val) => setPeekMode(val)}
            className="relative flex-shrink-0 text-left"
          >
            <Listbox.Button className={`grid place-items-center ${peekMode === "full" ? "rotate-45" : ""}`}>
              <Icon iconName={peekModes.find((m) => m.key === peekMode)?.icon ?? ""} className="text-[1rem]" />
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
              <Listbox.Options className="absolute left-0 z-10 mt-1 min-w-[8rem] origin-top-left overflow-y-auto whitespace-nowrap rounded-md border border-custom-border-300 bg-custom-background-90 text-xs shadow-lg focus:outline-none">
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
                                className={`-my-1 flex-shrink-0 !text-base ${mode.key === "full" ? "rotate-45" : ""}`}
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
        {isClipboardWriteAllowed && (peekMode === "side" || peekMode === "modal") && (
          <div className="flex flex-shrink-0 items-center gap-2">
            <button type="button" onClick={handleCopyLink} className="-rotate-45 focus:outline-none" tabIndex={1}>
              <Icon iconName="link" className="text-[1rem]" />
            </button>
          </div>
        )}
      </div>
    </>
  );
});
