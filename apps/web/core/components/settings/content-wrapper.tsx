// plane imports
import { cn } from "@plane/utils";
// components
import { AppHeader } from "@/components/core/app-header";

type Props = {
  children: React.ReactNode;
  header: React.ReactNode;
  hugging?: boolean;
};

export function SettingsContentWrapper(props: Props) {
  const { children, header, hugging = false } = props;

  return (
    <div className="grow size-full flex flex-col">
      <div className="shrink-0 w-full">
        <AppHeader header={header} />
      </div>
      <div
        className={cn("grow py-9 px-page-x overflow-y-scroll", {
          "lg:px-12 w-full": hugging,
          "w-full max-w-225 mx-auto": !hugging,
        })}
      >
        {children}
      </div>
    </div>
  );
}
