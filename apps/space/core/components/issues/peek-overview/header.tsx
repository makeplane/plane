import React from "react";
import { observer } from "mobx-react";
import { MoveRight } from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
// ui
import { LinkIcon, CenterPanelIcon, FullScreenPanelIcon, SidePanelIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
import useClipboardWritePermission from "@/hooks/use-clipboard-write-permission";
// types
import type { IIssue, IPeekMode } from "@/types/issue";

type Props = {
  handleClose: () => void;
  issueDetails: IIssue | undefined;
};

const PEEK_MODES: {
  key: IPeekMode;
  icon: any;
  label: string;
}[] = [
  { key: "side", icon: SidePanelIcon, label: "Side Peek" },
  {
    key: "modal",
    icon: CenterPanelIcon,
    label: "Modal",
  },
  {
    key: "full",
    icon: FullScreenPanelIcon,
    label: "Full Screen",
  },
];

export const PeekOverviewHeader = observer(function PeekOverviewHeader(props: Props) {
  const { handleClose } = props;

  const { peekMode, setPeekMode } = useIssueDetails();
  const isClipboardWriteAllowed = useClipboardWritePermission();

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied!",
        message: "Work item link copied to clipboard.",
      });
    });
  };

  const Icon = PEEK_MODES.find((m) => m.key === peekMode)?.icon ?? SidePanelIcon;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {peekMode === "side" && (
            <button type="button" onClick={handleClose} className="text-tertiary hover:text-secondary">
              <MoveRight className="size-4" />
            </button>
          )}
          <Listbox
            as="div"
            value={peekMode}
            onChange={(val) => setPeekMode(val)}
            className="relative shrink-0 text-left"
          >
            <Listbox.Button
              className={`grid place-items-center text-tertiary hover:text-secondary ${peekMode === "full" ? "rotate-45" : ""}`}
            >
              <Icon className="h-4 w-4 text-tertiary hover:text-secondary" />
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
              <Listbox.Options className="absolute left-0 z-10 mt-1 min-w-[12rem] origin-top-left overflow-y-auto whitespace-nowrap rounded-md border border-strong bg-surface-2 text-11 shadow-lg focus:outline-none">
                <div className="space-y-1 p-2">
                  {PEEK_MODES.map((mode) => (
                    <Listbox.Option
                      key={mode.key}
                      value={mode.key}
                      className={({ active, selected }) =>
                        `cursor-pointer select-none truncate rounded-sm px-1 py-1.5 ${
                          active ? "bg-layer-transparent-hover" : ""
                        } ${selected ? "text-primary" : "text-secondary"}`
                      }
                    >
                      <div className="flex items-center gap-1.5">
                        <mode.icon className="-my-1 h-4 w-4 flex-shrink-0" />
                        {mode.label}
                      </div>
                    </Listbox.Option>
                  ))}
                </div>
              </Listbox.Options>
            </Transition>
          </Listbox>
        </div>
        {isClipboardWriteAllowed && (peekMode === "side" || peekMode === "modal") && (
          <button
            type="button"
            onClick={handleCopyLink}
            className="shrink-0 focus:outline-none text-tertiary hover:text-secondary"
            tabIndex={1}
          >
            <LinkIcon className="h-4 w-4 -rotate-45" />
          </button>
        )}
      </div>
    </>
  );
});
