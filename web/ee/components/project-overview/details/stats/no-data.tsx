import Link from "next/link";
import { Button, LayersIcon } from "@plane/ui";

type TProp = {
  workspaceSlug: string;
  projectId: string;
};

export const NoStats = (props: TProp) => {
  const { workspaceSlug, projectId } = props;
  return (
    <div className="flex py-6 border rounded mt-4">
      <div className="m-auto flex flex-col gap-2">
        <div className="bg-custom-background-80 rounded p-2 w-fit m-auto">
          <LayersIcon className="w-4 h-4 text-custom-text-300" />
        </div>
        <div className="font-medium text-base m-auto w-fit"> No data yet</div>
        <div className="text-sm text-custom-text-350 w-fit m-auto">
          Start working on the issues to get metrics on the progress
        </div>
        <Link href={`/${workspaceSlug}/projects/${projectId}/issues`}>
          <Button variant="accent-primary" size="sm" className="m-auto">
            Go to issues
          </Button>
        </Link>
      </div>
    </div>
  );
};
