import { Crown } from "lucide-react";
// ui
import { Button } from "@plane/ui";
import { useWorkspaceSubscription } from "@/plane-web/hooks/use-workspace-subscription";

export const IssueEmbedUpgradeCard: React.FC<any> = (props) => {
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  return (
    <div
      className={`${
        props.selected ? "border-custom-primary-200 border-[2px]" : ""
      } w-full h-[100px] cursor-pointer space-y-2 rounded-md border-[0.5px] border-custom-border-200 shadow-custom-shadow-2xs`}
    >
      <h5 className="h-[20%] text-xs text-custom-text-300 p-2">
        {props.node?.attrs?.project_identifier}-{props?.node?.attrs?.sequence_id}
      </h5>
      <div className="relative h-[71%]">
        <div className="h-full backdrop-filter backdrop-blur-[30px] bg-custom-background-80 bg-opacity-30 flex items-center w-full justify-between gap-5 mt-2.5 pl-4 pr-5 py-3 max-md:max-w-full max-md:flex-wrap relative">
          <div className="flex gap-2 items-center">
            <div className="rounded">
              <Crown className="m-2" size={16} color="#FFBA18" />
            </div>
            <div className="text-custom-text text-sm">
              Embed and access work items in pages seamlessly, upgrade to plane pro now.
            </div>
          </div>
          <Button variant="primary" onClick={() => togglePaidPlanModal(true)}>
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );
};
