import { useMemo } from "react";
import { useParams } from "next/navigation";
// constants
import { MAX_STATIC_FILE_SIZE } from "@/constants/common";
// hooks
import { useInstance } from "@/hooks/store";
// local constants
import { MAX_PRO_FILE_SIZE } from "../constants/common";
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

  let maxFileSize: number | undefined = useMemo(() => config?.file_size_limit, [config?.file_size_limit]);
  if (!planDetails?.is_self_managed && isProPlanEnabled) {
    maxFileSize = MAX_PRO_FILE_SIZE;
  }

  return {
    maxFileSize: maxFileSize ?? MAX_STATIC_FILE_SIZE,
  };
};
