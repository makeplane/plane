import { Button } from "@plane/ui";

type Props = {
  title: string | React.ReactNode;
  description?: string;
  appendToRight?: React.ReactNode;
  showButton?: boolean;
  customButton?: React.ReactNode;
  button?: {
    label: string;
    onClick: () => void;
  };
};

export const SettingsHeading = ({
  title,
  description,
  button,
  appendToRight,
  customButton,
  showButton = true,
}: Props) => (
  <div className="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between border-b border-custom-border-100 pb-3.5">
    <div className="flex flex-col items-start gap-1">
      {typeof title === "string" ? <h3 className="text-xl font-medium">{title}</h3> : title}
      {description && <div className="text-sm text-custom-text-300">{description}</div>}
    </div>
    {showButton && customButton}
    {button && showButton && (
      <Button variant="primary" onClick={button.onClick} size="sm" className="w-fit">
        {button.label}
      </Button>
    )}
    {appendToRight}
  </div>
);

export default SettingsHeading;
