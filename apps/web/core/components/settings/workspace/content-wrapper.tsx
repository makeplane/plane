// plane imports
import { cn } from "@plane/utils";
// components
import { AppHeader } from "@/components/core/app-header";

type Props = {
  children: React.ReactNode;
  header: React.ReactNode;
  hugging?: boolean;
};

export function WorkspaceSettingsContentWrapper(props: Props) {
  const { children, header, hugging = false } = props;

  return (
    <div className="grow size-full flex flex-col">
      <AppHeader header={header} />
      <div
        className={cn("py-9 px-page-x", {
          "lg:px-12 w-full": hugging,
          "w-full max-w-225 mx-auto": !hugging,
        })}
      >
        {children}
      </div>
    </div>
  );
}
