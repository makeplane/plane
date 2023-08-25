// ui
import { CustomSelect, Icon } from "components/ui";
// types
import { IIssue } from "types";
import { TPeekOverviewModes } from "./layout";

type Props = {
  handleClose: () => void;
  issue: IIssue;
  mode: TPeekOverviewModes;
  setMode: (mode: TPeekOverviewModes) => void;
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

export const PeekOverviewHeader: React.FC<Props> = ({ issue, handleClose, mode, setMode }) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-4">
      {mode === "side" && (
        <button type="button" onClick={handleClose}>
          <Icon iconName="arrow_right_alt" className="!text-base" />
        </button>
      )}
      {mode === "modal" || mode === "full" ? (
        <button type="button" onClick={() => setMode("side")}>
          <Icon iconName="close_fullscreen" />
        </button>
      ) : (
        <button type="button" onClick={() => setMode("modal")}>
          <Icon iconName="open_in_full" />
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
        <button type="button" className="-rotate-45">
          <Icon iconName="link" />
        </button>
        <button type="button">
          <Icon iconName="delete" />
        </button>
      </div>
    )}
  </div>
);
