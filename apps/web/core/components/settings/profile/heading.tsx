// plane imports
import { cn } from "@plane/ui";

type Props = {
  className?: string;
  control?: React.ReactNode;
  description?: React.ReactNode;
  title?: React.ReactNode;
};

export function ProfileSettingsHeading({ className, control, description, title }: Props) {
  return (
    <div className={cn("flex flex-col md:flex-row gap-4 items-start md:items-center justify-between", className)}>
      <div className="flex flex-col items-start gap-1">
        {title && <h6 className="text-h6-medium text-primary">{title}</h6>}
        {description && <p className="text-body-xs-regular text-tertiary">{description}</p>}
      </div>
      {control}
    </div>
  );
}
