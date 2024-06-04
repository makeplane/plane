import { observer } from "mobx-react";
// components
import { BulkOperationsUpgradeBanner } from "@/components/issues";
// hooks
import { useMultipleSelectStore } from "@/hooks/store";

type Props = {
  className?: string;
};

export const IssueBulkOperationsRoot: React.FC<Props> = observer((props) => {
  const { className } = props;
  // store hooks
  const { isSelectionActive } = useMultipleSelectStore();

  if (!isSelectionActive) return null;

  return <BulkOperationsUpgradeBanner className={className} />;
});
