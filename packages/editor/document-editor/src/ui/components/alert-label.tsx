import { SVGProps } from "react";

interface IAlertLabelProps {
  Icon?: LucideIcon;
  backgroundColor: string;
  textColor?: string;
  label: string;
}

interface LucideProps extends Partial<SVGProps<SVGSVGElement>> {
  size?: string | number;
  absoluteStrokeWidth?: boolean;
}

type LucideIcon = (props: LucideProps) => JSX.Element;

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
