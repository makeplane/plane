// plane web hooks
import { useFlag } from "@/plane-web/hooks/store/use-flag";

export const useBulkOperationStatus = () => {
  // store hooks
  const isBulkOpsEnabled = useFlag("BULK_OPS");
  return isBulkOpsEnabled;
};
