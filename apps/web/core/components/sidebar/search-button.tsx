import { Search } from "lucide-react";
import { cn } from "@plane/utils";

type Props = {
  isActive?: boolean;
};

export function SidebarSearchButton(props: Props) {
  const { isActive } = props;
  return (
    <div
      className={cn(
        "flex-shrink-0 size-8 aspect-square grid place-items-center rounded-md shadow-sm hover:bg-custom-sidebar-background-90 outline-none border-[0.5px] border-custom-sidebar-border-300",
        {
          "bg-custom-primary-100/10 hover:bg-custom-primary-100/10 border-custom-primary-200": isActive,
        }
      )}
    >
      <Search
        className={cn("size-4 text-custom-sidebar-text-300", {
          "text-custom-primary-200": isActive,
        })}
      />
    </div>
  );
}
