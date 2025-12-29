import { SearchIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

type Props = {
  isActive?: boolean;
};

export function SidebarSearchButton(props: Props) {
  const { isActive } = props;
  return (
    <div
      className={cn(
        "flex-shrink-0 size-8 aspect-square grid place-items-center rounded-md shadow-sm hover:bg-surface-2 outline-none border-[0.5px] border-strong",
        {
          "bg-accent-primary/10 hover:bg-accent-primary/10 border-accent-strong-200": isActive,
        }
      )}
    >
      <SearchIcon
        className={cn("size-4 text-tertiary", {
          "text-accent-secondary": isActive,
        })}
      />
    </div>
  );
}
