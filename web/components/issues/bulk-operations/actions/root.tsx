// community-edition
import { BulkSubscribeIssues, BulkTransferIssues } from "@plane/bulk-operations";
// components
import { BulkArchiveIssues, BulkDeleteIssues } from "@/components/issues";

type Props = {
  handleClearSelection: () => void;
  selectedEntityIds: string[];
};

export const BulkOperationsActionsRoot: React.FC<Props> = (props) => {
  const { handleClearSelection, selectedEntityIds } = props;

  return (
    <>
      <div className="h-7 px-3 flex items-center gap-6 flex-shrink-0">
        <BulkSubscribeIssues />
        <BulkTransferIssues />
        <BulkArchiveIssues handleClearSelection={handleClearSelection} selectedIssueIds={selectedEntityIds} />
      </div>
      <div className="h-7 px-3 flex items-center gap-3 flex-shrink-0">
        <BulkDeleteIssues handleClearSelection={handleClearSelection} selectedIssueIds={selectedEntityIds} />
      </div>
    </>
  );
};
