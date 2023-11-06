import { PlusIcon } from "lucide-react";
// components
import { EmptyState } from "components/common";
// assets
import emptyIssue from "public/empty-state/issue.svg";

export const GlobalViewEmptyState: React.FC = () => (
  <div className="h-full w-full grid place-items-center">
    <EmptyState
      title="View issues will appear here"
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
    />
  </div>
);
