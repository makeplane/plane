import { Button, CustomMenu } from "@plane/ui"
import { ChevronUp, Icon, MoreVertical } from "lucide-react"


type TMenuItems = "archive_page" | "unarchive_page" | "lock_page" | "unlock_page" | "copy_markdown" | "close_page" | "copy_page_link" | "duplicate_page"

export interface IVerticalDropdownItemProps {
  key: number,
  type: TMenuItems,
  Icon: Icon,
  label: string,
  action: () => Promise<void> | void
}

export interface IVerticalDropdownMenuProps {
  items: IVerticalDropdownItemProps[],
}

const VerticalDropdownItem = ({ Icon, label, action }: IVerticalDropdownItemProps) => {

  return (
    <CustomMenu.MenuItem>
      <Button variant={"neutral-primary"} onClick={action} className="flex flex-row border-none items-center m-1 max-md:pr-5 cursor-pointer">
        <Icon size={16} />
        <div className="text-custom-text-300 ml-2 mr-2 leading-5 tracking-tight whitespace-nowrap self-start text-md">
          {label}
        </div>
      </Button>
    </CustomMenu.MenuItem>
  )
}

export const VerticalDropdownMenu = ({ items }: IVerticalDropdownMenuProps) => {

  return (
    <CustomMenu maxHeight={"lg"} className={"h-4"} placement={"bottom-start"} optionsClassName={"border-custom-border border-r border-solid transition-all duration-200 ease-in-out "} customButton={
				<MoreVertical size={18}/>
			}>
      {items.map((item, index) => (
        <VerticalDropdownItem
          key={index}
          type={item.type}
          Icon={item.Icon}
          label={item.label}
          action={item.action}
        />
      ))}
    </CustomMenu>
  )
}
