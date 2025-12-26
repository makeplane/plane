import { CheckIcon } from "@plane/propel/icons";

type Props = {
  icon?: React.ReactNode;
  isChecked: boolean;
  title: React.ReactNode;
  onClick?: () => void;
  multiple?: boolean;
  activePulse?: boolean;
};

export function FilterOption(props: Props) {
  const { icon, isChecked, multiple = true, onClick, title, activePulse = false } = props;

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-sm p-1.5 hover:bg-layer-transparent-hover"
      onClick={onClick}
    >
      <div
        className={`grid h-3 w-3 flex-shrink-0 place-items-center border ${
          isChecked ? "border-accent-strong bg-accent-primary text-on-color" : "border-strong"
        } ${multiple ? "rounded-xs" : "rounded-full"}`}
      >
        {isChecked && <CheckIcon width={10} height={10} strokeWidth={3} />}
      </div>
      <div className="flex items-center gap-2 truncate">
        {icon && <div className="grid w-5 flex-shrink-0 place-items-center">{icon}</div>}
        <div className="flex-grow truncate text-caption-sm-regular text-secondary">{title}</div>
      </div>
      {activePulse && (
        <div className="flex-shrink-0 text-caption-sm-regular w-2 h-2 rounded-full bg-accent-primary animate-pulse ml-auto" />
      )}
    </button>
  );
}
