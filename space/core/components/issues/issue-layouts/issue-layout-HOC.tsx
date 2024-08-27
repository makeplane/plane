import { observer } from "mobx-react";
// import { useTheme } from "next-themes";
import { useTheme } from "next-themes";
import { TLoader } from "@plane/types";
import { LogoSpinner } from "@/components/common";
import { EmptyState } from "@/components/common/empty-state";
import emptyIssueDark from "@/public/empty-state/search/issues-dark.webp"
import emptyIssueLight from "@/public/empty-state/search/issues-light.webp"

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

  const { resolvedTheme } = useTheme();

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
    return <div className="flex w-full h-full items-center justify-center">
      {/* No Issues Found */}
      <EmptyState
          image={resolvedTheme === "dark" ? emptyIssueDark : emptyIssueLight}
          title="Issue does not exist"
          description="The project you are looking for has no issues or has been archived."
        />
      </div>;
  }

  return <>{props.children}</>;
});
