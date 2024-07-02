import { cn } from "@/helpers/common.helper";

type TProps = {
  children: React.ReactNode;
  className?: string;
  darkerShade?: boolean;
};

export const CodeBlock = ({ children, className, darkerShade }: TProps) => (
  <span
    className={cn(
      "px-0.5 text-xs text-custom-text-300 bg-custom-background-90 font-semibold rounded-md border border-custom-border-100",
      {
        "text-custom-text-200 bg-custom-background-80 border-custom-border-200": darkerShade,
      },
      className
    )}
  >
    {children}
  </span>
);
