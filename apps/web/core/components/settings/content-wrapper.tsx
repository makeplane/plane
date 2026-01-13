// plane imports
import { cn } from "@plane/utils";
// components
import { AppHeader } from "@/components/core/app-header";

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode;
  hugging?: boolean;
};

export function SettingsContentWrapper(props: Props) {
  const { children, header, hugging = false } = props;

  return (
    <div className="@container grow size-full flex flex-col overflow-hidden">
      {header && (
        <div className="shrink-0 w-full">
          <AppHeader header={header} />
        </div>
      )}
      <div
        className={cn("grow py-9 overflow-y-scroll", {
          "px-page-x lg:px-12 w-full": hugging,
          "w-full max-w-225 mx-auto px-page-x @min-[58.95rem]:px-0": !hugging, // 58.95rem = max-width(56.25rem) + padding-x(1.35rem * 2)
        })}
      >
        {children}
      </div>
    </div>
  );
}
