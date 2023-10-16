import { useState } from "react";

// components
import { CreateInboxIssueModal } from "components/inbox";
// ui
import { Button } from "@plane/ui";
// icons
import { Plus } from "lucide-react";

export const ProjectInboxHeader = () => {
  const [createIssueModal, setCreateIssueModal] = useState(false);

  return (
    <>
      <CreateInboxIssueModal isOpen={createIssueModal} onClose={() => setCreateIssueModal(false)} />
      <Button onClick={() => setCreateIssueModal(true)} size="sm" prependIcon={<Plus />}>
        Add Issue
      </Button>
    </>
  );
};
