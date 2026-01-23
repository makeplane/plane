// plane imports
import { cn } from "@plane/ui";

type Props = {
  className?: string;
  control?: React.ReactNode;
  description?: React.ReactNode;
  title?: React.ReactNode;
  variant?: "h3" | "h4" | "h6";
};

export function SettingsHeading({ className, control, description, title, variant = "h3" }: Props) {
  return (
    <div className={cn("flex flex-col md:flex-row gap-4 items-start md:items-center justify-between", className)}>
      <div className="flex flex-col items-start gap-1">
        {title && (
          <h3
            className={cn("text-h3-medium text-primary", {
              "text-h3-medium": variant === "h3",
              "text-h4-medium": variant === "h4",
              "text-h6-medium": variant === "h6",
            })}
          >
            {title}
          </h3>
        )}
        {description && <p className="text-body-xs-regular text-tertiary">{description}</p>}
      </div>
      {control}
    </div>
  );
}
