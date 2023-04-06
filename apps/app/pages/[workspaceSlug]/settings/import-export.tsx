import { useRouter } from "next/router";

// lib
import { requiredWorkspaceAdmin } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
import IntegrationGuide from "components/integration/guide";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import { UserAuth } from "types";
import type { GetServerSideProps, NextPage } from "next";

const ImportExport: NextPage<UserAuth> = (props) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <AppLayout
      memberType={props}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title={`${workspaceSlug ?? "Workspace"}`} link={`/${workspaceSlug}`} />
          <BreadcrumbItem title="Members Settings" />
        </Breadcrumbs>
      }
      settingsLayout
    >
      <IntegrationGuide />
    </AppLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const workspaceSlug = ctx.params?.workspaceSlug as string;

  const memberDetail = await requiredWorkspaceAdmin(workspaceSlug, ctx.req.headers.cookie);

  if (memberDetail === null) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default ImportExport;
