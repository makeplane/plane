"use client";

import React from "react";
import { observer } from "mobx-react";
import { Link2, MoveRight } from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
// ui
import { CenterPanelIcon, FullScreenPanelIcon, setToast, SidePanelIcon, TOAST_TYPE } from "@plane/ui";
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

export const PeekOverviewHeader: React.FC<Props> = observer((props) => {
  const { handleClose } = props;

  const { peekMode, setPeekMode } = useIssueDetails();
  const isClipboardWriteAllowed = useClipboardWritePermission();

  const handleCopyLink = () => {
    const urlToCopy = window.location.href;

    copyTextToClipboard(urlToCopy).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link copied!",
        message: "Issue link copied to clipboard.",
      });
    });
  };

  const Icon = PEEK_MODES.find((m) => m.key === peekMode)?.icon ?? SidePanelIcon;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {peekMode === "side" && (
            <button type="button" onClick={handleClose} className="text-custom-text-300 hover:text-custom-text-200">
              <MoveRight className="size-4" />
            </button>
          )}
          <Listbox
            as="div"
            value={peekMode}
            onChange={(val) => setPeekMode(val)}
            className="relative flex-shrink-0 text-left"
          >
            <Listbox.Button
              className={`grid place-items-center text-custom-text-300 hover:text-custom-text-200 ${peekMode === "full" ? "rotate-45" : ""}`}
            >
              <Icon className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
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
              <Listbox.Options className="absolute left-0 z-10 mt-1 min-w-[12rem] origin-top-left overflow-y-auto whitespace-nowrap rounded-md border border-custom-border-300 bg-custom-background-90 text-xs shadow-lg focus:outline-none">
                <div className="space-y-1 p-2">
                  {PEEK_MODES.map((mode) => (
                    <Listbox.Option
                      key={mode.key}
                      value={mode.key}
                      className={({ active, selected }) =>
                        `cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                          active ? "bg-custom-background-80" : ""
                        } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
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
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="focus:outline-none text-custom-text-300 hover:text-custom-text-200"
              tabIndex={1}
            >
              <Link2 className="h-4 w-4 -rotate-45" />
            </button>
          </div>
        )}
      </div>
    </>
  );
});
