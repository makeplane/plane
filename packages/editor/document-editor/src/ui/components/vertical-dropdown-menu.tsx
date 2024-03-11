import { LucideIconType } from "@plane/editor-core";
import { CustomMenu } from "@plane/ui";
import { MoreVertical } from "lucide-react";

type TMenuItems =
  | "archive_page"
  | "unarchive_page"
  | "lock_page"
  | "unlock_page"
  | "copy_markdown"
  | "close_page"
  | "copy_page_link"
  | "duplicate_page";

export interface IVerticalDropdownItemProps {
  key: number;
  type: TMenuItems;
  Icon: LucideIconType;
  label: string;
  action: () => Promise<void> | void;
}

export interface IVerticalDropdownMenuProps {
  items: IVerticalDropdownItemProps[];
}

const VerticalDropdownItem = ({ Icon, label, action }: IVerticalDropdownItemProps) => (
  <CustomMenu.MenuItem onClick={action} className="flex items-center gap-2">
    <Icon className="h-3 w-3" />
    <div className="text-custom-text-300">{label}</div>
  </CustomMenu.MenuItem>
);

export const VerticalDropdownMenu = ({ items }: IVerticalDropdownMenuProps) => (
  <CustomMenu
    maxHeight={"md"}
    className={"h-4.5 mt-1"}
    placement={"bottom-start"}
    optionsClassName={"border-custom-border border-r border-solid transition-all duration-200 ease-in-out "}
    customButton={<MoreVertical size={14} />}
  >
    {items.map((item) => (
      <VerticalDropdownItem key={item.key} type={item.type} Icon={item.Icon} label={item.label} action={item.action} />
    ))}
  </CustomMenu>
);
