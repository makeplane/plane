import { cn } from "@plane/utils";

type TProps = {
  children: React.ReactNode;
  className?: string;
  darkerShade?: boolean;
};

export function CodeBlock({ children, className, darkerShade }: TProps) {
  return (
    <span
      className={cn(
        "px-0.5 text-11 text-tertiary bg-custom-background-90 font-semibold rounded-md border border-subtle",
        {
          "text-secondary bg-custom-background-80 border-subtle-1": darkerShade,
        },
        className
      )}
    >
      {children}
    </span>
  );
}
