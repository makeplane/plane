import { useMemo } from "react";
import { useParams } from "next/navigation";
// plane imports
import { MAX_FILE_SIZE, MAX_PRO_FILE_SIZE } from "@plane/constants";
// hooks
import { useInstance } from "@/hooks/store/use-instance";
// local hooks
import { useFlag, useWorkspaceSubscription } from "./store";

type TReturnProps = {
  maxFileSize: number;
};

export const useFileSize = (): TReturnProps => {
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { config } = useInstance();
  const { currentWorkspaceSubscribedPlanDetail: planDetails } = useWorkspaceSubscription();
  // derived values
  const isProPlanEnabled = useFlag(workspaceSlug?.toString() ?? "", "FILE_SIZE_LIMIT_PRO");

  const maxFileSize: number | undefined = useMemo(() => {
    if (!planDetails?.is_self_managed && isProPlanEnabled) {
      return MAX_PRO_FILE_SIZE;
    }
    return config?.file_size_limit;
  }, [config?.file_size_limit, isProPlanEnabled, planDetails?.is_self_managed]);

  return {
    maxFileSize: maxFileSize ?? MAX_FILE_SIZE,
  };
};
