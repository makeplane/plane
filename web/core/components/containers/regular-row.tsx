import { cn } from "@plane/editor";

type Props = {
  children: string | JSX.Element | JSX.Element[];
  className?: string;
};
export const RegularRow = ({ children, className }: Props) => (
  <div className={cn("px-page-x py-page-y w-full", className)}>{children}</div>
);
