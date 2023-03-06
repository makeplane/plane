import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// lib
import { requiredAdmin } from "lib/auth";
// services
import stateService from "services/state.service";
import projectService from "services/project.service";
// layouts
import AppLayout from "layouts/app-layout";
// components
import {
  CreateUpdateStateInline,
  DeleteStateModal,
  SingleState,
  StateGroup,
} from "components/states";
// ui
import { Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { getStatesList, orderStateGroups } from "helpers/state.helper";
// types
import { UserAuth } from "types";
import type { NextPage, GetServerSidePropsContext } from "next";
// fetch-keys
import { PROJECT_DETAILS, STATE_LIST } from "constants/fetch-keys";

const StatesSettings: NextPage<UserAuth> = (props) => {
  const { isMember, isOwner, isViewer, isGuest } = props;

  const [activeGroup, setActiveGroup] = useState<StateGroup>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectDeleteState, setSelectDeleteState] = useState<string | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: projectDetails } = useSWR(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATE_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const orderedStateGroups = orderStateGroups(states ?? {});
  const statesList = getStatesList(orderedStateGroups ?? {});

  return (
    <>
      <DeleteStateModal
        isOpen={!!selectDeleteState}
        data={statesList?.find((s) => s.id === selectDeleteState) ?? null}
        onClose={() => setSelectDeleteState(null)}
      />
      <AppLayout
        memberType={{ isMember, isOwner, isViewer, isGuest }}
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${projectDetails?.name ?? "Project"}`}
              link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
            />
            <BreadcrumbItem title="States Settings" />
          </Breadcrumbs>
        }
        settingsLayout
      >
        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 sm:col-span-5">
            <h3 className="text-2xl font-semibold">States</h3>
            <p className="text-gray-500">Manage the states of this project.</p>
          </div>
          <div className="col-span-12 space-y-8 sm:col-span-7">
            {states && projectDetails ? (
              Object.keys(orderedStateGroups).map((key) => {
                if (orderedStateGroups[key].length !== 0)
                  return (
                    <div key={key}>
                      <div className="mb-2 flex w-full justify-between">
                        <h4 className="font-medium capitalize">{key}</h4>
                        <button
                          type="button"
                          className="flex items-center gap-2 text-theme outline-none"
                          onClick={() => setActiveGroup(key as keyof StateGroup)}
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                      <div className="divide-y rounded-[10px] border">
                        {key === activeGroup && (
                          <CreateUpdateStateInline
                            onClose={() => {
                              setActiveGroup(null);
                              setSelectedState(null);
                            }}
                            data={null}
                            selectedGroup={key as keyof StateGroup}
                          />
                        )}
                        {orderedStateGroups[key].map((state, index) =>
                          state.id !== selectedState ? (
                            <SingleState
                              key={state.id}
                              index={index}
                              state={state}
                              statesList={statesList}
                              handleEditState={() => setSelectedState(state.id)}
                              handleDeleteState={() => setSelectDeleteState(state.id)}
                            />
                          ) : (
                            <div className="border-b last:border-b-0" key={state.id}>
                              <CreateUpdateStateInline
                                onClose={() => {
                                  setActiveGroup(null);
                                  setSelectedState(null);
                                }}
                                data={
                                  statesList?.find((state) => state.id === selectedState) ?? null
                                }
                                selectedGroup={key as keyof StateGroup}
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
              })
            ) : (
              <Loader className="space-y-5 md:w-2/3">
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
                <Loader.Item height="40px" />
              </Loader>
            )}
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const projectId = ctx.query.projectId as string;
  const workspaceSlug = ctx.query.workspaceSlug as string;

  const memberDetail = await requiredAdmin(workspaceSlug, projectId, ctx.req?.headers.cookie);

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default StatesSettings;
