import { cn } from "@plane/utils";

type Props = React.ComponentProps<"button"> & {
  label: React.ReactNode;
  onClick: () => void;
};

export function SidebarAddButton(props: Props) {
  const { label, onClick, disabled, ...rest } = props;
  return (
    <button
      type="button"
      className={cn(
        "flex-grow text-tertiary text-13 font-medium border-[0.5px] border-strong text-left rounded-md shadow-sm h-8 px-2 flex items-center gap-1.5",
        !disabled && "hover:bg-surface-2"
      )}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {label}
    </button>
  );
}
