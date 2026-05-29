import { cn } from "@plane/utils";

type Props = {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionElement?: React.ReactNode;
  customClassName?: string;
};

export function SectionEmptyState(props: Props) {
  const { title, description, icon, actionElement, customClassName } = props;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-md border border-subtle p-10",
        customClassName
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-sm bg-layer-1">{icon}</div>
        <span className="text-13 font-medium">{title}</span>
        {description && <span className="text-11 text-tertiary">{description}</span>}
      </div>
      {actionElement && <>{actionElement}</>}
    </div>
  );
}
