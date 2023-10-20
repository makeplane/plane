import { FC, ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Maximize2, ArrowRight, Link, Trash, PanelRightOpen, Square, SquareCode } from "lucide-react";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
// components
import { PeekOverviewIssueDetails } from "./issue-detail";
import { PeekOverviewProperties } from "./properties";
// types
import { IIssue } from "types";
import { RootStore } from "store/root";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";

interface IIssueView {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueUpdate: (issue: Partial<IIssue>) => void;
  issueReactionCreate: (reaction: string) => void;
  issueReactionRemove: (reaction: string) => void;
  states: any;
  members: any;
  priorities: any;
  children: ReactNode;
}

type TPeekModes = "side-peek" | "modal" | "full-screen";

const peekOptions: { key: TPeekModes; icon: any; title: string }[] = [
  {
    key: "side-peek",
    icon: PanelRightOpen,
    title: "Side Peek",
  },
  {
    key: "modal",
    icon: Square,
    title: "Modal",
  },
  {
    key: "full-screen",
    icon: SquareCode,
    title: "Full Screen",
  },
];

export const IssueView: FC<IIssueView> = observer((props) => {
  const {
    workspaceSlug,
    projectId,
    issueId,
    issueUpdate,
    issueReactionCreate,
    issueReactionRemove,
    states,
    members,
    priorities,
    children,
  } = props;

  const router = useRouter();
  const { peekIssueId } = router.query as { peekIssueId: string };

  const { user: userStore, issueDetail: issueDetailStore }: RootStore = useMobxStore();

  const [peekMode, setPeekMode] = useState<TPeekModes>("side-peek");
  const handlePeekMode = (_peek: TPeekModes) => {
    if (peekMode != _peek) setPeekMode(_peek);
  };

  const updateRoutePeekId = () => {
    if (issueId != peekIssueId) {
      const { query } = router;
      router.push({
        pathname: router.pathname,
        query: { ...query, peekIssueId: issueId },
      });
    }
  };
  const removeRoutePeekId = () => {
    const { query } = router;
    if (query.peekIssueId) {
      delete query.peekIssueId;
      router.push({
        pathname: router.pathname,
        query: { ...query },
      });
    }
  };

  const redirectToIssueDetail = () => {
    router.push({
      pathname: `/${workspaceSlug}/projects/${projectId}/issues/${issueId}`,
    });
  };

  useSWR(
    workspaceSlug && projectId && issueId && peekIssueId && issueId === peekIssueId
      ? `ISSUE_PEEK_OVERVIEW_${workspaceSlug}_${projectId}_${peekIssueId}`
      : null,
    async () => {
      if (workspaceSlug && projectId && issueId && peekIssueId && issueId === peekIssueId) {
        await issueDetailStore.fetchPeekIssueDetails(workspaceSlug, projectId, issueId);
      }
    }
  );

  const issue = issueDetailStore.getIssue;
  const issueReactions = issueDetailStore.getIssueReactions;
  const user = userStore?.currentUser;

  return (
    <div className="w-full !text-base">
      <div onClick={updateRoutePeekId} className="w-full cursor-pointer">
        {children}
      </div>

      {issueId === peekIssueId && (
        <div
          className={`fixed z-50 overflow-hidden bg-custom-background-80 flex flex-col transition-all duration-300 border border-custom-border-200 rounded shadow-custom-shadow-2xl
          ${peekMode === "side-peek" ? `w-full md:w-[50%] top-0 right-0 bottom-0` : ``}
          ${peekMode === "modal" ? `top-[50%] left-[50%] -translate-x-[50%] -translate-y-[50%] w-5/6 h-5/6` : ``}
          ${peekMode === "full-screen" ? `top-0 right-0 bottom-0 left-0 m-4` : ``}
          `}
        >
          {/* header */}
          <div className="flex-shrink-0 w-full p-4 py-3 relative flex items-center gap-2 border-b border-custom-border-200">
            <div
              className="flex-shrink-0 overflow-hidden w-6 h-6 flex justify-center items-center rounded-sm transition-all duration-100 border border-custom-border-200 cursor-pointer hover:bg-custom-background-100"
              onClick={removeRoutePeekId}
            >
              <ArrowRight width={12} strokeWidth={2} />
            </div>

            <div
              className="flex-shrink-0 overflow-hidden w-6 h-6 flex justify-center items-center rounded-sm transition-all duration-100 border border-custom-border-200 cursor-pointer hover:bg-custom-background-100"
              onClick={redirectToIssueDetail}
            >
              <Maximize2 width={12} strokeWidth={2} />
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
              {peekOptions.map((_option) => (
                <div
                  key={_option?.key}
                  className={`px-1.5 min-w-6 h-6 flex justify-center items-center gap-1 rounded-sm transition-all duration-100 border border-custom-border-200 cursor-pointer hover:bg-custom-background-100 
                  ${peekMode === _option?.key ? `bg-custom-background-100` : ``}
                  `}
                  onClick={() => handlePeekMode(_option?.key)}
                >
                  <_option.icon width={14} strokeWidth={2} />
                  <div className="text-xs font-medium">{_option?.title}</div>
                </div>
              ))}
            </div>

            <div className="w-full flex justify-end items-center gap-2">
              <div className="px-1.5 min-w-6 h-6 text-xs font-medium flex justify-center items-center rounded-sm transition-all duration-100 border border-custom-border-200 cursor-pointer hover:bg-custom-background-100">
                Subscribe
              </div>

              <div className="overflow-hidden w-6 h-6 flex justify-center items-center rounded-sm transition-all duration-100 border border-custom-border-200 cursor-pointer hover:bg-custom-background-100">
                <Link width={12} strokeWidth={2} />
              </div>

              <div className="overflow-hidden w-6 h-6 flex justify-center items-center rounded-sm transition-all duration-100 border border-custom-border-200 cursor-pointer hover:bg-custom-background-100">
                <Trash width={12} strokeWidth={2} />
              </div>
            </div>
          </div>

          {/* content */}
          <div className="w-full h-full overflow-hidden overflow-y-auto">
            {issueDetailStore?.loader && !issue ? (
              <div className="text-center py-10">Loading...</div>
            ) : (
              issue && (
                <>
                  {["side-peek", "modal"].includes(peekMode) ? (
                    <div className="space-y-8 p-4 py-5">
                      <PeekOverviewIssueDetails
                        workspaceSlug={workspaceSlug}
                        issue={issue}
                        issueUpdate={issueUpdate}
                        issueReactions={issueReactions}
                        user={user}
                        issueReactionCreate={issueReactionCreate}
                        issueReactionRemove={issueReactionRemove}
                      />

                      <PeekOverviewProperties
                        issue={issue}
                        issueUpdate={issueUpdate}
                        states={states}
                        members={members}
                        priorities={priorities}
                      />

                      {/* <div className="border border-red-500">Activity</div> */}
                    </div>
                  ) : (
                    <div className="w-full h-full flex">
                      <div className="w-full h-full space-y-8 p-4 py-5">
                        <PeekOverviewIssueDetails
                          workspaceSlug={workspaceSlug}
                          issue={issue}
                          issueReactions={issueReactions}
                          issueUpdate={issueUpdate}
                          user={user}
                          issueReactionCreate={issueReactionCreate}
                          issueReactionRemove={issueReactionRemove}
                        />

                        {/* <div className="border border-red-500">Activity</div> */}
                      </div>
                      <div className="flex-shrink-0 !w-[400px] h-full border-l border-custom-border-200 p-4 py-5">
                        <PeekOverviewProperties
                          issue={issue}
                          issueUpdate={issueUpdate}
                          states={states}
                          members={members}
                          priorities={priorities}
                        />
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
});
