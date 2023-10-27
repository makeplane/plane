import Link from "next/link";

// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomSelect, FullScreenPeekIcon, ModalPeekIcon, SidePeekIcon } from "@plane/ui";
// icons
import { LinkIcon, MoveRight, Trash2 } from "lucide-react";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IIssue } from "types";
import { TPeekOverviewModes } from "./layout";

type Props = {
  handleClose: () => void;
  handleDeleteIssue: () => void;
  issue: IIssue | undefined;
  mode: TPeekOverviewModes;
  setMode: (mode: TPeekOverviewModes) => void;
  workspaceSlug: string;
};

const peekModes: {
  key: TPeekOverviewModes;
  icon: any;
  label: string;
}[] = [
  { key: "side", icon: SidePeekIcon, label: "Side Peek" },
  {
    key: "modal",
    icon: ModalPeekIcon,
    label: "Modal Peek",
  },
  {
    key: "full",
    icon: FullScreenPeekIcon,
    label: "Full Screen Peek",
  },
];

export const PeekOverviewHeader: React.FC<Props> = ({
  issue,
  handleClose,
  handleDeleteIssue,
  mode,
  setMode,
  workspaceSlug,
}) => {
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

  const currentMode = peekModes.find((m) => m.key === mode);

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        {mode === "side" && (
          <button type="button" onClick={handleClose}>
            <MoveRight className="h-3.5 w-3.5" />
          </button>
        )}
        <Link href={`/${workspaceSlug}/projects/${issue?.project}/issues/${issue?.id}`}>
          <a>
            <FullScreenPeekIcon className="h-3.5 w-3.5" />
          </a>
        </Link>
        <CustomSelect
          value={mode}
          onChange={(val: TPeekOverviewModes) => setMode(val)}
          customButton={
            <button type="button" className={`grid place-items-center ${mode === "full" ? "rotate-45" : ""}`}>
              {currentMode && <currentMode.icon className="h-3.5 w-3.5" />}
            </button>
          }
        >
          {peekModes.map((mode) => (
            <CustomSelect.Option key={mode.key} value={mode.key}>
              <div className="flex items-center gap-1.5">
                <mode.icon className={`h-4 w-4 flex-shrink-0 -my-1 ${mode.key === "full" ? "rotate-45" : ""}`} />
                {mode.label}
              </div>
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </div>
      {(mode === "side" || mode === "modal") && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <button type="button" onClick={handleCopyLink} className="-rotate-45">
            <LinkIcon className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={handleDeleteIssue}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
