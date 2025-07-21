import { cn } from "@plane/utils";

type TAttributePillProps = {
  data: string;
  className?: string;
};

export const AttributePill = ({ data, className }: TAttributePillProps) => (
  <span
    className={cn(
      "flex-shrink-0 w-fit px-2 py-0.5 text-xs font-medium text-custom-text-300 bg-custom-background-80/40 rounded",
      className
    )}
  >
    {data}
  </span>
);
