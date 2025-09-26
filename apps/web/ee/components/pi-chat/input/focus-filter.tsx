import { Dispatch, SetStateAction } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { AtSign } from "lucide-react";
import { EUserPermissionsLevel } from "@plane/constants";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
import { EUserProjectRoles, IProject, IWorkspace } from "@plane/types";
import { CustomSelect, Loader, Logo, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { WorkspaceLogo } from "@/components/workspace/logo";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { TFocus } from "@/plane-web/types";

type TProps = {
  focus: TFocus;
  isLoading: boolean;
  setFocus: Dispatch<SetStateAction<TFocus>>;
};
export const FocusFilter = observer((props: TProps) => {
  const { focus, setFocus, isLoading } = props;
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getWorkspaceBySlug } = useWorkspace();
  const { workspaceProjectIds, getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const workspace = getWorkspaceBySlug(workspaceSlug as string);
  const selectedFocus = focus.entityType === "workspace_id" ? workspace : getProjectById(focus.entityIdentifier);
  // helper
  const updateFocus = <K extends keyof TFocus>(key: K, value: TFocus[K]) => {
    setFocus((prev) => {
      const updated = { ...prev, [key]: value };
      return updated;
    });
  };

  if (isLoading)
    return (
      <Loader>
        <Loader.Item width="100px" height="30px" className="rounded-lg" />
      </Loader>
    );

  return (
    <CustomSelect
      value={focus}
      label={
        <Tooltip
          tooltipContent="Turn this on if you want Pi to use your work data from Plane."
          position="top"
          className="ml-4 max-w-[200px] font-medium text-custom-text-300"
          disabled={focus.isInWorkspaceContext}
        >
          <div className="flex rounded-full font-medium gap-2 w-full overflow-hidden">
            {!isEmpty(focus) && !isEmpty(selectedFocus) && focus.isInWorkspaceContext ? (
              <div className=" flex items-center gap-2 text-sm my-auto capitalize truncate">
                {focus.entityType === "workspace_id" ? (
                  <WorkspaceLogo
                    logo={(selectedFocus as IWorkspace)?.logo_url}
                    name={selectedFocus?.name}
                    classNames={"w-4 h-4 text-[9px]"}
                  />
                ) : (
                  <Logo logo={(selectedFocus as IProject)?.logo_props} />
                )}
                <span className="truncate">{selectedFocus?.name}</span>
              </div>
            ) : (
              <div className="text-sm font-medium text-custom-text-300 my-auto flex items-center gap-2">
                <AtSign className="size-4" /> <span>Add context </span>
              </div>
            )}
          </div>
        </Tooltip>
      }
      noChevron
      onChange={(val: string) => {
        updateFocus("entityType", val.split("%")[0]);
        updateFocus("entityIdentifier", val.split("%")[1]);
        if (!focus.isInWorkspaceContext) {
          updateFocus("isInWorkspaceContext", true);
        }
      }}
      maxHeight="lg"
      className="flex flex-col-reverse"
      buttonClassName={cn(
        "rounded-md h-full px-2 border-[0.5px] border-custom-border-200 max-h-[30px] overflow-hidden max-w-[200px] hover:bg-custom-background-100"
      )}
      optionsClassName="max-h-[70vh] overflow-y-auto"
    >
      <div className="flex flex-col divide-y divide-custom-border-100 space-y-2 max-w-[192px] max-h-full">
        <div>
          <span className="text-custom-text-350 font-medium">Ask Pi to use data from:</span>
          <CustomSelect.Option
            value={`workspace_id%${workspace?.id}`}
            className="text-sm text-custom-text-200 font-medium flex justify-start"
          >
            <WorkspaceLogo logo={workspace?.logo_url} name={workspace?.name} classNames={"w-4 h-4 text-[9px]"} />
            <span className="truncate">{workspace?.name}</span>
          </CustomSelect.Option>
          {workspaceProjectIds && workspaceProjectIds.length > 0 && (
            <span className="text-custom-text-350 font-medium">Projects</span>
          )}
          {workspaceProjectIds &&
            workspaceProjectIds.map((id) => {
              const project = getProjectById(id);
              if (
                allowPermissions(
                  [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER, EUserProjectRoles.GUEST],
                  EUserPermissionsLevel.PROJECT,
                  workspaceSlug.toString(),
                  project?.id
                )
              )
                return (
                  <CustomSelect.Option
                    key={id}
                    value={`project_id%${id}`}
                    className="text-sm text-custom-text-200 font-medium"
                  >
                    <div className="flex flex-start gap-2 max-w-full">
                      <div className="size-4 m-auto">{project && <Logo logo={project?.logo_props} />}</div>{" "}
                      <span className="truncate">{project?.name}</span>
                    </div>
                  </CustomSelect.Option>
                );
            })}
        </div>
        <div className="pt-2 flex justify-between gap-2">
          <div className="text-wrap font-medium text-custom-text-350">
            Turn this off if you don’t want Pi to use your work from Plane.{" "}
          </div>
          <ToggleSwitch
            value={focus.isInWorkspaceContext ?? false}
            onChange={() => {
              updateFocus("isInWorkspaceContext", !focus.isInWorkspaceContext);
            }}
            size="sm"
          />
        </div>
      </div>
    </CustomSelect>
  );
});
