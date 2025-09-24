import { cn } from "@plane/ui";
import { addSpaceIfCamelCase } from "@plane/utils";

export const DisplayLabels = (props: {
  className?: string;
  labels: {
    color?: string;
    name: string;
  }[];
}) => {
  const { labels, className } = props;
  return (
    <div className={cn("flex items-center gap-1 text-sm text-custom-text-300", className)}>
      {labels.map((label, index) => (
        <div key={index} className="flex items-center gap-1.5 max-w-[100px]">
          <div
            className={cn("flex-shrink-0 h-2 w-2 rounded-full", { "bg-custom-background-90": !label?.color })}
            style={{ backgroundColor: label?.color }}
          />
          <div className="truncate">{addSpaceIfCamelCase(label?.name ?? "")}</div>
        </div>
      ))}
    </div>
  );
};
