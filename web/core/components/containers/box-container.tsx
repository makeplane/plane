import { cn } from "@plane/editor";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export const BoxContainer = ({ children, className = "" }: Props) => (
  <div
    className={cn(
      `bg-custom-background-100 rounded-xl border-[0.5px] border-custom-border-200 w-full hover:shadow-custom-shadow-4xl duration-300 p-6`,
      className
    )}
  >
    {children}
  </div>
);
