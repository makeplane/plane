import { observer } from "mobx-react";
import { TLoader } from "@plane/types";
import { LogoSpinner } from "@/components/common";

interface Props {
  children: string | JSX.Element | JSX.Element[];
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
    return <div className="flex w-full h-full items-center justify-center">No Issues Found</div>;
  }

  return <>{props.children}</>;
});
