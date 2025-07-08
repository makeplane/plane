import { cn } from "@plane/utils";

type Props = {
  className?: string;
  input: React.ReactNode;
  inputClassName?: string;
  title: string;
  titleClassName?: string;
};

export const WidgetPropertyWrapper: React.FC<Props> = (props) => {
  const { className, input, inputClassName, title, titleClassName } = props;

  return (
    <div className={cn("h-8 grid grid-cols-9 items-center gap-2", className)}>
      <p className={cn("col-span-4 font-medium text-[12px] text-custom-text-300", titleClassName)}>{title}</p>
      <div className={cn("col-span-5 text-custom-text-200", inputClassName)}>{input}</div>
    </div>
  );
};
