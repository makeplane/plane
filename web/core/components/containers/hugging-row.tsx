import { cn } from "@plane/editor";

type Props = {
  children: string | JSX.Element | JSX.Element[];
  className?: string;
};
export const HuggingRow = ({ children, className }: Props) => (
  <div className={cn("px-0 py-page-y h-full w-full", className)}>{children}</div>
);
