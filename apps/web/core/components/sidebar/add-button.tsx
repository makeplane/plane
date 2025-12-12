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
        "flex-grow text-tertiary text-13 font-medium border-[0.5px] border-strong text-left rounded-md shadow-raised-100 h-8 px-2 flex items-center gap-1.5 transition-colors",
        !disabled && "hover:bg-layer-transparent-hover"
      )}
      onClick={onClick}
      disabled={disabled}
      {...rest}
    >
      {label}
    </button>
  );
}
