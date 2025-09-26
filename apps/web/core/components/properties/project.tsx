import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { BriefcaseBusiness } from "lucide-react";
import { cn } from "@plane/propel/utils";
import { TLogoProps } from "@plane/types";
import { Logo } from "@/components/common/logo";
import { useProject } from "@/hooks/store/use-project";

export const DisplayProject = observer(
  (props: { project: { name: string; id: string; logo_props?: TLogoProps }; className?: string }) => {
    const { project, className } = props;
    const { getProjectById } = useProject();
    const projectDetails = getProjectById(project.id);
    const logoProps = project?.logo_props || projectDetails?.logo_props;
    return (
      <div
        className={cn("flex items-center gap-1 text-sm text-custom-text-300 max-w-[100px] overflow-hidden", className)}
      >
        {!isEmpty(logoProps) ? (
          <Logo logo={logoProps} size={16} />
        ) : (
          <span className="grid h-4 w-4 flex-shrink-0 place-items-center">
            <BriefcaseBusiness className="h-4 w-4" />
          </span>
        )}
        <div className="truncate">{project?.name}</div>
      </div>
    );
  }
);
