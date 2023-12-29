import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Command } from "cmdk";
import { Check } from "lucide-react";
// mobx store
import { useIssues } from "hooks/store";
// ui
import { PriorityIcon } from "@plane/ui";
// types
import { TIssue, TIssuePriorities } from "@plane/types";
// constants
import { EIssuesStoreType, ISSUE_PRIORITIES } from "constants/issue";

type Props = {
  closePalette: () => void;
  issue: TIssue;
};

export const ChangeIssuePriority: React.FC<Props> = observer((props) => {
  const { closePalette, issue } = props;

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const {
    issues: { updateIssue },
  } = useIssues(EIssuesStoreType.PROJECT);

  const submitChanges = async (formData: Partial<TIssue>) => {
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
      {ISSUE_PRIORITIES.map((priority) => (
        <Command.Item key={priority.key} onSelect={() => handleIssueState(priority.key)} className="focus:outline-none">
          <div className="flex items-center space-x-3">
            <PriorityIcon priority={priority.key} />
            <span className="capitalize">{priority.title ?? "None"}</span>
          </div>
          <div>{priority.key === issue.priority && <Check className="h-3 w-3" />}</div>
        </Command.Item>
      ))}
    </>
  );
});
