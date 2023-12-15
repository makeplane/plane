import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// cmdk
import { Command } from "cmdk";
// ui
import { Spinner, StateGroupIcon } from "@plane/ui";
// icons
import { Check } from "lucide-react";
// types
import { IIssue } from "types";

type Props = {
  closePalette: () => void;
  issue: IIssue;
};

export const ChangeIssueState: React.FC<Props> = observer((props) => {
  const { closePalette, issue } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    projectState: { projectStates },
    projectIssues: { updateIssue },
  } = useMobxStore();

  const submitChanges = async (formData: Partial<IIssue>) => {
    if (!workspaceSlug || !projectId || !issue) return;

    const payload = { ...formData };
    await updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, payload).catch((e) => {
      console.error(e);
    });
  };

  const handleIssueState = (stateId: string) => {
    submitChanges({ state: stateId });
    closePalette();
  };

  return (
    <>
      {projectStates ? (
        projectStates.length > 0 ? (
          projectStates.map((state) => (
            <Command.Item key={state.id} onSelect={() => handleIssueState(state.id)} className="focus:outline-none">
              <div className="flex items-center space-x-3">
                <StateGroupIcon stateGroup={state.group} color={state.color} height="16px" width="16px" />
                <p>{state.name}</p>
              </div>
              <div>{state.id === issue.state && <Check className="h-3 w-3" />}</div>
            </Command.Item>
          ))
        ) : (
          <div className="text-center">No states found</div>
        )
      ) : (
        <Spinner />
      )}
    </>
  );
});
