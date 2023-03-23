import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR, { mutate } from "swr";

// lib
import { requiredAuth } from "lib/auth";

// services
import projectService from "services/project.service";

// layouts
import AppLayout from "layouts/app-layout";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";

// fetching keys
import { PAGE_BLOCK_LIST, PROJECT_DETAILS } from "constants/fetch-keys";
// components
import { CustomMenu } from "components/ui";

// types
import { IPageBlock, IView } from "types";
import type { NextPage, GetServerSidePropsContext } from "next";
import pagesService from "services/pages.service";
import useToast from "hooks/use-toast";

const PageBlock: React.FC<any> = ({ pageBlock }: { pageBlock: IPageBlock }) => {
  const [name, setName] = useState(pageBlock.name);
  const { setToastAlert } = useToast();
  const {
    query: { workspaceSlug, projectId, pageId },
  } = useRouter();

  const updatePageBlock = async () => {
    const pageBlockId = pageBlock.id;
    await pagesService
      .patchPageBlock(
        workspaceSlug as string,
        projectId as string,
        pageId as string,
        pageBlockId as string,
        {
          name,
        }
      )
      .then(() => {
        mutate(PAGE_BLOCK_LIST(pageId as string));
        console.log("Updated block");
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be updated. Please try again.",
        });
      });
  };

  const deletePageBlock = async () => {
    const pageBlockId = pageBlock.id;
    await pagesService
      .deletePageBlock(
        workspaceSlug as string,
        projectId as string,
        pageId as string,
        pageBlockId as string
      )
      .then(() => {
        mutate(PAGE_BLOCK_LIST(pageId as string));
        console.log("deleted block");
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be deleted. Please try again.",
        });
      });
  };

  return (
    <li className="group flex justify-between rounded p-2 hover:bg-slate-100">
      <input
        type="text"
        value={name}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            console.log("Updating...");
            updatePageBlock();
          }
        }}
        onChange={(e) => {
          setName(e.target.value);
        }}
        className="border-none bg-transparent outline-none"
      />
      <div className="hidden group-hover:block">
        <CustomMenu>
          <CustomMenu.MenuItem>Convert to issue</CustomMenu.MenuItem>
          <CustomMenu.MenuItem onClick={deletePageBlock}>Delete block</CustomMenu.MenuItem>
        </CustomMenu>
      </div>
    </li>
  );
};

const ProjectPages: NextPage = () => {
  const { setToastAlert } = useToast();
  const {
    query: { workspaceSlug, projectId, pageId },
  } = useRouter();

  const { data: activeProject } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: pageBlocks } = useSWR(
    workspaceSlug && projectId && pageId ? PAGE_BLOCK_LIST(pageId as string) : null,
    workspaceSlug && projectId
      ? () =>
          pagesService.listPageBlocks(
            workspaceSlug as string,
            projectId as string,
            pageId as string
          )
      : null
  );

  const createPageBlock = async () => {
    await pagesService
      .createPageBlock(workspaceSlug as string, projectId as string, pageId as string, {
        name: "New block",
      })
      .then(() => {
        mutate(PAGE_BLOCK_LIST(pageId as string));
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Page could not be created. Please try again.",
        });
      });
  };

  return (
    <AppLayout
      meta={{
        title: "Plane - Pages",
      }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="Projects" link={`/${workspaceSlug}/projects`} />
          <BreadcrumbItem title={`${activeProject?.name ?? "Project"} Pages`} />
        </Breadcrumbs>
      }
    >
      <div className="flex space-x-4 px-2">
        <button onClick={createPageBlock}>Li</button>
        <button onClick={() => {}}>P</button>
      </div>
      <div className="rounded border border-slate-200 bg-white p-4 ">
        {pageBlocks
          ? pageBlocks.length === 0
            ? "Write something..."
            : pageBlocks.map((pageBlock) => <PageBlock key={pageBlock.id} pageBlock={pageBlock} />)
          : "Loading..."}
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

export default ProjectPages;
