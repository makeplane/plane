import { Button } from "@plane/propel/button";
import { cn } from "@plane/ui";

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
  className?: string;
};

export function SettingsHeading({
  title,
  description,
  button,
  appendToRight,
  customButton,
  showButton = true,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row gap-2 items-start md:items-center justify-between border-b border-subtle pb-3.5",
        className
      )}
    >
      <div className="flex flex-col items-start gap-1">
        {typeof title === "string" ? <h3 className="text-18 font-medium">{title}</h3> : title}
        {description && <div className="text-13 text-tertiary">{description}</div>}
      </div>
      {showButton && customButton}
      {button && showButton && (
        <Button variant="primary" size="lg" onClick={button.onClick} className="w-fit">
          {button.label}
        </Button>
      )}
      {appendToRight}
    </div>
  );
}

export default SettingsHeading;
