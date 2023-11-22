import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Command } from "cmdk";
import { Check } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { PriorityIcon } from "@plane/ui";
// types
import { IIssue, TIssuePriorities } from "types";
// constants
import { PRIORITIES } from "constants/project";

type Props = {
  closePalette: () => void;
  issue: IIssue;
};

export const ChangeIssuePriority: React.FC<Props> = observer((props) => {
  const { closePalette, issue } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    issueDetail: { updateIssue },
  } = useMobxStore();

  const submitChanges = async (formData: Partial<IIssue>) => {
    if (!workspaceSlug || !projectId || !issue) return;

    const payload = { ...formData };
    await updateIssue(workspaceSlug.toString(), projectId.toString(), issue.id, payload).catch((e) => {
      console.error(e);
    });
  };

  const handleIssueState = (priority: TIssuePriorities) => {
    submitChanges({ priority });
    closePalette();
  };

  return (
    <>
      {PRIORITIES.map((priority) => (
        <Command.Item key={priority} onSelect={() => handleIssueState(priority)} className="focus:outline-none">
          <div className="flex items-center space-x-3">
            <PriorityIcon priority={priority} />
            <span className="capitalize">{priority ?? "None"}</span>
          </div>
          <div>{priority === issue.priority && <Check className="h-3 w-3" />}</div>
        </Command.Item>
      ))}
    </>
  );
});
