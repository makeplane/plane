import { useEffect } from "react";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import Head from "next/head";
// types
import { TIssueBoardKeys } from "store/types";
import ProjectLayout from "layouts/project-layout";
import { ProjectDetailsView } from "components/views/project-details";

const WorkspaceProjectPage = (props: any) => {
  console.log("props", props);
  const SITE_TITLE = props?.project_settings?.project_details?.name || "Plane | Deploy";

  const router = useRouter();

  // const activeIssueId = store.issue.activePeekOverviewIssueId;

  const { workspace_slug, project_slug, board, states, labels, priorities } = router.query as {
    workspace_slug: string;
    project_slug: string;
    board: TIssueBoardKeys;
    states: string[];
    labels: string[];
    priorities: string[];
  };

  // updating default board view when we are in the issues page
  // useEffect(() => {
  //   if (workspace_slug && project_slug && store?.project?.workspaceProjectSettings) {
  //     const workspaceProjectSettingViews = store?.project?.workspaceProjectSettings?.views;
  //     const userAccessViews: TIssueBoardKeys[] = [];

  //     Object.keys(workspaceProjectSettingViews).filter((_key) => {
  //       if (_key === "list" && workspaceProjectSettingViews.list === true) userAccessViews.push(_key);
  //       if (_key === "kanban" && workspaceProjectSettingViews.kanban === true) userAccessViews.push(_key);
  //       if (_key === "calendar" && workspaceProjectSettingViews.calendar === true) userAccessViews.push(_key);
  //       if (_key === "spreadsheet" && workspaceProjectSettingViews.spreadsheet === true) userAccessViews.push(_key);
  //       if (_key === "gantt" && workspaceProjectSettingViews.gantt === true) userAccessViews.push(_key);
  //     });

  //     let url = `/${workspace_slug}/${project_slug}`;
  //     let _board = board;

  //     if (userAccessViews && userAccessViews.length > 0) {
  //       if (!board) {
  //         store.issue.setCurrentIssueBoardView(userAccessViews[0]);
  //         _board = userAccessViews[0];
  //       } else {
  //         if (userAccessViews.includes(board)) {
  //           if (store.issue.currentIssueBoardView === null) store.issue.setCurrentIssueBoardView(board);
  //           else {
  //             if (board === store.issue.currentIssueBoardView) {
  //               _board = board;
  //             } else {
  //               _board = board;
  //               store.issue.setCurrentIssueBoardView(board);
  //             }
  //           }
  //         } else {
  //           store.issue.setCurrentIssueBoardView(userAccessViews[0]);
  //           _board = userAccessViews[0];
  //         }
  //       }
  //     }

  //     _board = _board || "list";
  //     url = `${url}?board=${_board}`;

  //     if (states) url = `${url}&states=${states}`;
  //     if (labels) url = `${url}&labels=${labels}`;
  //     if (priorities) url = `${url}&priorities=${priorities}`;

  //     url = decodeURIComponent(url);

  //     router.replace(url);
  //   }
  // }, [
  //   workspace_slug,
  //   project_slug,
  //   board,
  //   router,
  //   store?.issue,
  //   store?.project?.workspaceProjectSettings,
  //   states,
  //   labels,
  //   priorities,
  // ]);

  // useEffect(() => {
  //   if (!workspace_slug || !project_slug) return;

  //   const params = {
  //     state: states || null,
  //     labels: labels || null,
  //     priority: priorities || null,
  //   };

  //   store?.project?.getProjectSettingsAsync(workspace_slug, project_slug);
  //   store?.issue?.getIssuesAsync(workspace_slug, project_slug, params);
  // }, [workspace_slug, project_slug, store?.project, store?.issue, states, labels, priorities]);

  return (
    <ProjectLayout>
      <Head>
        <title>{SITE_TITLE}</title>
      </Head>
      <ProjectDetailsView />
    </ProjectLayout>
  );
};

// export const getServerSideProps: GetServerSideProps<any> = async ({ query: { workspace_slug, project_slug } }) => {
//   const res = await fetch(
//     `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/public/workspaces/${workspace_slug}/project-boards/${project_slug}/settings/`
//   );
//   const project_settings = await res.json();
//   return { props: { project_settings } };
// };

export default WorkspaceProjectPage;
