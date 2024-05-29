import { BulkArchiveIssues, BulkDeleteIssues } from "@/components/issues";

type Props = {
  handleClearSelection: () => void;
  selectedEntityIds: string[];
};

export const BulkOperationsActionsRoot: React.FC<Props> = (props) => {
  const { handleClearSelection, selectedEntityIds } = props;

  return (
    <div className="h-7 px-3 flex items-center gap-3 flex-shrink-0">
      <BulkArchiveIssues handleClearSelection={handleClearSelection} selectedEntityIds={selectedEntityIds} />
      <BulkDeleteIssues handleClearSelection={handleClearSelection} selectedEntityIds={selectedEntityIds} />
    </div>
  );
};
