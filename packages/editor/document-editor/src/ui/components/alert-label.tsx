import { LucideIconType } from "@plane/editor-core";

interface IAlertLabelProps {
  Icon?: LucideIconType;
  backgroundColor: string;
  textColor?: string;
  label: string;
}
export const AlertLabel = (props: IAlertLabelProps) => {
  const { Icon, backgroundColor, textColor, label } = props;

  return (
    <div
      className={`flex h-7 items-center gap-2 rounded-full px-3 py-0.5 text-xs font-medium ${backgroundColor} ${textColor}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      <span>{label}</span>
    </div>
  );
};
