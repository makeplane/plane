import { cn } from "@plane/editor";

type Props = {
  children: React.ReactNode;
  className?: string;
};
export const PageContainer = ({ children, className = "" }: Props) => (
  <div
    className={cn(
      "px-page-x py-page-y h-full w-full flex flex-col space-y-7 overflow-y-auto vertical-scrollbar scrollbar-md",
      className
    )}
  >
    {children}
  </div>
);
