import React from "react";

import { useRouter } from "next/router";

// lib
import { requiredAuth } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// hooks
import useIssues from "hooks/use-issues";
// components
import {
  CompletedIssuesGraph,
  IssuesList,
  IssuesPieChart,
  IssuesStats,
} from "components/workspace";
// helpers
import { orderArrayBy } from "helpers/array.helper";
// types
import type { NextPage, GetServerSidePropsContext } from "next";

const WorkspacePage: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { myIssues } = useIssues(workspaceSlug as string);

  const overdueIssues = orderArrayBy(
    myIssues?.filter(
      (i) =>
        i.target_date &&
        i.target_date !== "" &&
        !i.completed_at &&
        new Date(i.target_date) < new Date()
    ) ?? [],
    "target_date",
    "descending"
  );

  const incomingIssues = orderArrayBy(
    myIssues?.filter(
      (i) => i.target_date && i.target_date !== "" && new Date(i.target_date) > new Date()
    ) ?? [],
    "target_date"
  );

  return (
    <AppLayout noHeader={true}>
      <div className="h-full w-full">
        <div className="flex flex-col gap-8">
          <div
            className="flex flex-col justify-between gap-x-2 gap-y-6 rounded-lg px-8 py-6 text-white md:flex-row md:items-center md:py-3"
            style={{ background: "linear-gradient(90deg, #8e2de2 0%, #4a00e0 100%)" }}
          >
            <p>Plane is a open source application, to support us you can star us on GitHub!</p>
            <div className="flex items-center gap-2">
              {/* <a href="#" target="_blank" rel="noopener noreferrer">
                View roadmap
              </a> */}
              <a
                href="https://github.com/makeplane/plane"
                target="_blank"
                className="rounded-md border-2 border-white px-3 py-1.5 text-sm duration-300 hover:bg-white hover:text-[#4a00e0]"
                rel="noopener noreferrer"
              >
                Star us on GitHub
              </a>
            </div>
          </div>
          <IssuesStats issues={myIssues} />
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <IssuesList issues={overdueIssues} type="overdue" />
            <IssuesList issues={incomingIssues} type="upcoming" />
            <IssuesPieChart issues={myIssues} />
            <CompletedIssuesGraph issues={myIssues} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.resolvedUrl;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default WorkspacePage;
