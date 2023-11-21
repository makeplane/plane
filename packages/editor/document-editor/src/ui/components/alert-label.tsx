import { Icon } from "lucide-react"

interface IAlertLabelProps {
	Icon: Icon,
	backgroundColor: string,
	textColor?: string,
	label: string,
}

export const AlertLabel = ({ Icon, backgroundColor,textColor, label }: IAlertLabelProps) => {

  return (
    <div className={`text-xs flex items-center gap-1 ${backgroundColor} p-0.5 pl-3 pr-3 mr-1 rounded`}>
      <Icon size={12} />
      <span className={`normal-case ${textColor}`}>{label}</span>
    </div>
  )

}
