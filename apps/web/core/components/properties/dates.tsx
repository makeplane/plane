import { ArrowRight, Calendar } from "lucide-react";
import { cn, renderFormattedDate } from "@plane/utils";

export const DisplayDates = (props: {
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  className?: string;
}) => {
  const { startDate, endDate, className } = props;
  return (
    <div className={cn("flex items-center gap-1 text-custom-text-300", className)}>
      <Calendar className="size-3 flex-shrink-0" />
      <div className="text-sm"> {renderFormattedDate(startDate)}</div>
      {startDate && endDate && <ArrowRight className="h-3 w-3 flex-shrink-0" />}
      <div className="text-sm"> {renderFormattedDate(endDate)}</div>
    </div>
  );
};
