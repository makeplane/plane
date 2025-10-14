import { observer } from "mobx-react";
// plane imports
import type { TLoader } from "@plane/types";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";

interface Props {
  children: string | React.ReactNode | React.ReactNode[];
  getGroupIssueCount: (
    groupId: string | undefined,
    subGroupId: string | undefined,
    isSubGroupCumulative: boolean
  ) => number | undefined;
  getIssueLoader: (groupId?: string | undefined, subGroupId?: string | undefined) => TLoader;
}

export const IssueLayoutHOC = observer((props: Props) => {
  const { getIssueLoader, getGroupIssueCount } = props;

  const issueCount = getGroupIssueCount(undefined, undefined, false);

  if (getIssueLoader() === "init-loader" || issueCount === undefined) {
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  }

  if (getGroupIssueCount(undefined, undefined, false) === 0) {
    return <div className="flex w-full h-full items-center justify-center">No work items Found</div>;
  }

  return <>{props.children}</>;
});
