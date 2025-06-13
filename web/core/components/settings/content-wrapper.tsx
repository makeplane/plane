import { ReactNode } from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/utils";

type TProps = {
  children: ReactNode;
  size?: "lg" | "md";
};
export const SettingsContentWrapper = observer((props: TProps) => {
  const { children, size = "md" } = props;

  return (
    <div
      className={cn("flex flex-col w-full items-center mx-auto py-4 md:py-0", {
        "md:px-4 max-w-[800px] 2xl:max-w-[1000px]": size === "md",
        "md:px-16": size === "lg",
      })}
    >
      <div className="pb-10 w-full">{children}</div>
    </div>
  );
});
