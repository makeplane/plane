import { useEffect } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import estimatesService from "services/estimates.service";
// hooks
import useProjectDetails from "hooks/use-project-details";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// fetch-keys
import { ESTIMATE_POINTS_LIST } from "constants/fetch-keys";

const useEstimateOption = (estimateKey?: number | null) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { projectDetails } = useProjectDetails();

  const { data: estimatePoints, error: estimatePointsError } = useSWR(
    workspaceSlug && projectId && projectDetails && projectDetails?.estimate
      ? ESTIMATE_POINTS_LIST(projectDetails.estimate as string)
      : null,
    workspaceSlug && projectId && projectDetails && projectDetails.estimate
      ? () =>
          estimatesService.getEstimatesPointsList(
            workspaceSlug as string,
            projectId as string,
            projectDetails.estimate as string
          )
      : null
  );

  const estimateValue: any =
    (estimateKey && estimatePoints?.find((e) => e.key === estimateKey)?.value) ?? "None";

  useEffect(() => {
    if (estimatePointsError?.status === 404) router.push("/404");
    else if (estimatePointsError) router.push("/error");
  }, [estimatePointsError, router]);

  return {
    isEstimateActive: projectDetails?.estimate ? true : false,
    estimatePoints: orderArrayBy(estimatePoints ?? [], "key"),
    estimateValue,
  };
};

export default useEstimateOption;
