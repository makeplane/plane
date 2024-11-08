import { isEmpty } from "lodash";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ListFilter } from "lucide-react";
import { CustomSelect, Logo } from "@plane/ui";
import { WorkspaceLogo } from "@/components/workspace";
import { useProject, useWorkspace } from "@/hooks/store";
import { usePiChat } from "@/plane-web/hooks/store/use-pi-chat";

export const FocusFilter = observer(() => {
  // router params
  const { workspaceSlug } = useParams();

  // store hooks
  const { setFocus, currentFocus, activeChatId } = usePiChat();
  const { getWorkspaceBySlug } = useWorkspace();
  const { workspaceProjectIds, getProjectById } = useProject();

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
        <div className="flex rounded-full gap-2">
          <ListFilter size={16} className="text-pi-500 my-auto" />
          <span className="text-sm font-medium text-custom-text-300 my-auto">Focus</span>
          <span className="text-sm my-auto">{!isEmpty(currentFocus) ? `: ${selectedFocus}` : ""}</span>
        </div>
      }
      noChevron={!currentFocus}
      onChange={(val: string) => {
        setFocus(activeChatId, val.split("%")[0], val.split("%")[1]);
      }}
      maxHeight="lg"
      className="flex flex-col-reverse"
      buttonClassName="rounded-[28px] h-full px-2 bg-pi-100 border-none max-h-[36px]"
    >
      <span className="text-custom-text-350 font-medium">Ask Pi to use data from:</span>
      <CustomSelect.Option
        value={`workspace_id%${workspace?.id}`}
        className="text-sm text-custom-text-200 font-medium flex justify-start"
      >
        <WorkspaceLogo logo={workspace?.logo_url} name={workspace?.name} classNames={"w-4 h-4 text-[9px]"} />
        <span>{workspace?.name}</span>
      </CustomSelect.Option>
      <span className="text-custom-text-350 font-medium">Projects</span>
      {workspaceProjectIds &&
        workspaceProjectIds.map((id) => {
          const project = getProjectById(id);
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
    </CustomSelect>
  );
});
