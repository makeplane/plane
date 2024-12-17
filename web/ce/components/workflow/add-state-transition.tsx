import { Plus } from "lucide-react";
import { cn } from "@/helpers/common.helper";
// Plane

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentStateId: string;
  onTransitionAdd?: () => void;
};

export const AddStateTransition = (props: Props) => (
  <div className={cn("flex w-full px-3 h-6 items-center justify-start gap-2 text-sm bg-custom-background-90")}>
    <>
      <Plus className="h-4 w-4" color="#8591AD" />
      <span className="text-custom-text-400 font-medium"> Add Transition</span>
      <div className="text-white bg-custom-background-80 font-semibold px-2 rounded-lg">Pro</div>
    </>
  </div>
);
