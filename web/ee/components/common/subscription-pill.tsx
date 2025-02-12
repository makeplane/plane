import { EProductSubscriptionEnum } from "@plane/constants";
import { IWorkspace } from "@plane/types";
import { cn } from "@plane/utils";

type TProps = { workspace: IWorkspace };

export const SubscriptionPill = (props: TProps) => {
  const { workspace } = props;
  return (
    <div
      className={cn(
        "capitalize rounded bg-custom-background-80 px-2 py-[1px] text-xs font-semibold text-custom-text-300",
        {
          "bg-purple-900/30 text-purple-600": workspace.current_plan === EProductSubscriptionEnum.BUSINESS,
          "bg-custom-primary-100/20 text-custom-primary-100":
            workspace.current_plan?.includes(EProductSubscriptionEnum.PRO) ||
            workspace.current_plan?.includes(EProductSubscriptionEnum.ONE),
        }
      )}
    >
      <h1>{workspace.current_plan?.toLowerCase() || EProductSubscriptionEnum.FREE}</h1>
    </div>
  );
};
