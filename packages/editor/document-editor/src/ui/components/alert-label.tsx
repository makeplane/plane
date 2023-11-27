import { Icon } from "lucide-react";

interface IAlertLabelProps {
  Icon?: Icon;
  backgroundColor: string;
  textColor?: string;
  label: string;
}

export const AlertLabel = (props: IAlertLabelProps) => {
  const { Icon, backgroundColor, textColor, label } = props;

  return (
    <div
      className={`h-7 flex items-center gap-2 font-medium py-0.5 px-3 rounded-full text-xs ${backgroundColor} ${textColor}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  );
};
