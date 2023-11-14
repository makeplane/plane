import { Icon } from "lucide-react"

type TMenuItems = "copy_markdown" | "close_page" | "copy_page_link" | "duplicate_page" | "lock_page" | "archive_page"

export interface IVerticalDropdownItemProps {
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
    <div onClick={action} className="flex flex-row items-center mt-3 mb-3 gap-2 max-md:pr-5 cursor-pointer">
      <Icon size={16} />
      <div className="text-custom-text-300 leading-5 tracking-tight whitespace-nowrap self-start text-md">
        {label}
      </div>
    </div>
  )
}

export const VerticalDropdownMenu = ({ items }: IVerticalDropdownMenuProps) => {
  
  return (
    <div className="gap-5 pl-4 pr-4">
      { items.map((item, index) => (
        <VerticalDropdownItem
            type={item.type}
            Icon={item.Icon}
            label={item.label}
            action={item.action}
        />
      )) }
    </div>
  )
}
