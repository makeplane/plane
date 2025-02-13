import { isEmpty } from "lodash";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EUserProjectRoles, EUserPermissionsLevel } from "@plane/constants";
import { CustomSelect, Logo, ToggleSwitch, Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
import { WorkspaceLogo } from "@/components/workspace";
import { useProject, useUserPermissions, useWorkspace } from "@/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";

export const FocusFilter = observer(() => {
  // router params
  const { workspaceSlug } = useParams();

  // store hooks
  const { setFocus, setIsInWorkspaceContext, isInWorkspaceContext, currentFocus, activeChatId } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  const { workspaceProjectIds, getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();

  //   derived values
  const workspace = getWorkspaceBySlug(workspaceSlug as string);
  const selectedFocus =
    currentFocus?.entityType === "workspace_id"
      ? workspace?.name
      : getProjectById(currentFocus?.entityIdentifier)?.name;

  return (
    <CustomSelect
      value={currentFocus}
      label={
        <Tooltip
          tooltipContent="Turn this on if you want Pi to use your work data from Plane."
          position="top"
          className="ml-4 max-w-[192px] font-medium text-custom-text-300"
          disabled={isInWorkspaceContext}
        >
          <div className="flex rounded-full pl-2 font-medium gap-2">
            <span className="text-sm font-medium text-custom-text-300 my-auto">
              Focus{!isEmpty(currentFocus) && isInWorkspaceContext && ": "}
            </span>
            <span className="text-sm my-auto capitalize">
              {!isEmpty(currentFocus) && isInWorkspaceContext ? `${selectedFocus}` : ""}
            </span>
            {!isInWorkspaceContext && (
              <ToggleSwitch
                value={isInWorkspaceContext}
                onChange={() => {
                  setIsInWorkspaceContext(!isInWorkspaceContext);
                }}
                size="sm"
                className="ml-2"
              />
            )}
          </div>
        </Tooltip>
      }
      noChevron={!currentFocus || !isInWorkspaceContext}
      onChange={(val: string) => {
        setFocus(activeChatId, val.split("%")[0], val.split("%")[1]);
      }}
      maxHeight="lg"
      className="flex flex-col-reverse"
      buttonClassName={cn("rounded-[28px] h-full px-2 border-custom-border-200 max-h-[36px]", {
        "border-none bg-pi-100": isInWorkspaceContext,
      })}
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
            <span>{workspace?.name}</span>
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
                    <div className="flex flex-start gap-2">
                      <div className="size-4 m-auto">{project && <Logo logo={project?.logo_props} />}</div>{" "}
                      <span>{project?.name}</span>
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
            value={isInWorkspaceContext}
            onChange={() => {
              setIsInWorkspaceContext(!isInWorkspaceContext);
            }}
            size="sm"
          />
        </div>
      </div>
    </CustomSelect>
  );
});
