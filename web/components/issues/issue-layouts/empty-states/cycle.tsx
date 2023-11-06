import { PlusIcon } from "lucide-react";
// components
import { EmptyState } from "components/common";
// assets
import emptyIssue from "public/empty-state/issue.svg";
import { Button } from "@plane/ui";

type Props = {
  openIssuesListModal: () => void;
};

export const CycleEmptyState: React.FC<Props> = ({ openIssuesListModal }) => (
  <div className="h-full w-full grid place-items-center">
    <EmptyState
      title="Cycle issues will appear here"
      description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
      image={emptyIssue}
      primaryButton={{
        text: "New issue",
        icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
        onClick: () => {
          const e = new KeyboardEvent("keydown", {
            key: "c",
          });
          document.dispatchEvent(e);
        },
      }}
      secondaryButton={
        <Button
          variant="neutral-primary"
          prependIcon={<PlusIcon className="h-3 w-3" strokeWidth={2} onClick={openIssuesListModal} />}
        >
          Add an existing issue
        </Button>
      }
    />
  </div>
);
