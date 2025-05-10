import { Briefcase } from "lucide-react";
// plane package imports
import { Logo } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web hooks
import { useProject } from "@/hooks/store";

type Props = {
  project: {
    id: string;
    completed_issues?: number;
    total_issues?: number;
  };
  isLoading?: boolean;
};
const CompletionPercentage = ({ percentage }: { percentage: number }) => {
  const percentageColor = percentage > 50 ? "bg-green-500/30 text-green-500" : "bg-red-500/30 text-red-500";
  return (
    <div className={cn("flex items-center gap-2 rounded p-1 text-xs", percentageColor)}>
      <span>{percentage}%</span>
    </div>
  );
};

const ActiveProjectItem = (props: Props) => {
  const { project } = props;
  const { getProjectById } = useProject();
  const { id, completed_issues, total_issues } = project;

  const projectDetails = getProjectById(id);

  if (!projectDetails) return null;

  return (
    <div className="flex items-center justify-between gap-2  ">
      <div className="flex items-center gap-2">
        <div className="flex h-8  w-8 items-center justify-center rounded-xl bg-custom-background-80">
          <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
            {projectDetails?.logo_props ? (
              <Logo logo={projectDetails?.logo_props} size={16} />
            ) : (
              <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
                <Briefcase className="h-4 w-4" />
              </span>
            )}
          </span>
        </div>
        <p className="text-sm font-medium">{projectDetails?.name}</p>
      </div>
      <CompletionPercentage
        percentage={completed_issues && total_issues ? Math.round((completed_issues / total_issues) * 100) : 0}
      />
    </div>
  );
};

export default ActiveProjectItem;
