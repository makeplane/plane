// hooks
import useToast from "hooks/use-toast";
// ui
import { CustomSelect, Icon } from "components/ui";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
// types
import { IIssue } from "types";
import { TPeekOverviewModes } from "./layout";
import { ArrowRightAlt, CloseFullscreen, East, OpenInFull } from "@mui/icons-material";

type Props = {
  handleClose: () => void;
  handleDeleteIssue: () => void;
  issue: IIssue;
  mode: TPeekOverviewModes;
  setMode: (mode: TPeekOverviewModes) => void;
  workspaceSlug: string;
};

const peekModes: {
  key: TPeekOverviewModes;
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
    const originURL =
      typeof window !== "undefined" && window.location.origin ? window.location.origin : "";

    copyTextToClipboard(
      `${originURL}/${workspaceSlug}/projects/${issue.project}/issues/${issue.id}`
    ).then(() => {
      setToastAlert({
        type: "success",
        title: "Link copied!",
        message: "Issue link copied to clipboard",
      });
    });
  };

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        {mode === "side" && (
          <button type="button" onClick={handleClose}>
            <East
              sx={{
                fontSize: "14px",
              }}
            />
          </button>
        )}
        {mode === "modal" || mode === "full" ? (
          <button type="button" onClick={() => setMode("side")}>
            <CloseFullscreen
              sx={{
                fontSize: "14px",
              }}
            />
          </button>
        ) : (
          <button type="button" onClick={() => setMode("modal")}>
            <OpenInFull
              sx={{
                fontSize: "14px",
              }}
            />
          </button>
        )}
        <CustomSelect
          value={mode}
          onChange={(val: TPeekOverviewModes) => setMode(val)}
          customButton={
            <button
              type="button"
              className={`grid place-items-center ${mode === "full" ? "rotate-45" : ""}`}
            >
              <Icon iconName={peekModes.find((m) => m.key === mode)?.icon ?? ""} />
            </button>
          }
          position="left"
        >
          {peekModes.map((mode) => (
            <CustomSelect.Option key={mode.key} value={mode.key}>
              <div className="flex items-center gap-1.5">
                <Icon
                  iconName={mode.icon}
                  className={`!text-base flex-shrink-0 -my-1 ${
                    mode.key === "full" ? "rotate-45" : ""
                  }`}
                />
                {mode.label}
              </div>
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      </div>
      {(mode === "side" || mode === "modal") && (
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleCopyLink} className="-rotate-45">
            <Icon iconName="link" />
          </button>
          <button type="button" onClick={handleDeleteIssue}>
            <Icon iconName="delete" />
          </button>
        </div>
      )}
    </div>
  );
};
