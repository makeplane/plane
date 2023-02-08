import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
import projectService from "services/project.service";
// lib
import { requiredAdmin } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// components
import { CreateUpdateStateInline, DeleteStateModal, StateGroup } from "components/states";
// ui
import { Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
// helpers
import { addSpaceIfCamelCase } from "helpers/string.helper";
import { getStatesList, orderStateGroups } from "helpers/state.helper";
// types
import { UserAuth } from "types";
import type { NextPage, NextPageContext } from "next";
// fetch-keys
import { PROJECT_DETAILS, STATE_LIST } from "constants/fetch-keys";

const StatesSettings: NextPage<UserAuth> = (props) => {
  const { isMember, isOwner, isViewer, isGuest } = props;

  const [activeGroup, setActiveGroup] = useState<StateGroup>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectDeleteState, setSelectDeleteState] = useState<string | null>(null);

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

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
        settingsLayout="project"
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
      >
        <div className="space-y-8">
          <div>
            <h3 className="text-3xl font-bold leading-6 text-gray-900">States</h3>
            <p className="mt-4 text-sm text-gray-500">Manage the state of this project.</p>
          </div>
          <div className="flex flex-col justify-between gap-4">
            {states && projectDetails ? (
              Object.keys(orderedStateGroups).map((key) => {
                if (orderedStateGroups[key].length !== 0)
                  return (
                    <div key={key}>
                      <div className="mb-2 flex w-full justify-between md:w-2/3">
                        <p className="text-md capitalize leading-6 text-gray-900">{key} states</p>
                        <button
                          type="button"
                          onClick={() => setActiveGroup(key as keyof StateGroup)}
                          className="flex items-center gap-2 text-xs text-theme"
                        >
                          <PlusIcon className="h-3 w-3 text-theme" />
                          Add
                        </button>
                      </div>
                      <div className="space-y-1 rounded-xl border p-1 md:w-2/3">
                        {key === activeGroup && (
                          <CreateUpdateStateInline
                            projectId={projectDetails.id}
                            onClose={() => {
                              setActiveGroup(null);
                              setSelectedState(null);
                            }}
                            workspaceSlug={workspaceSlug as string}
                            data={null}
                            selectedGroup={key as keyof StateGroup}
                          />
                        )}
                        {orderedStateGroups[key].map((state) =>
                          state.id !== selectedState ? (
                            <div
                              key={state.id}
                              className={`flex items-center justify-between gap-2 border-b bg-gray-50 p-3 ${
                                activeGroup !== key ? "last:border-0" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="h-3 w-3 flex-shrink-0 rounded-full"
                                  style={{
                                    backgroundColor: state.color,
                                  }}
                                />
                                <h6 className="text-sm">{addSpaceIfCamelCase(state.name)}</h6>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSelectDeleteState(state.id)}
                                >
                                  <TrashIcon className="h-4 w-4 text-red-400" />
                                </button>
                                <button type="button" onClick={() => setSelectedState(state.id)}>
                                  <PencilSquareIcon className="h-4 w-4 text-gray-400" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="border-b last:border-b-0" key={state.id}>
                              <CreateUpdateStateInline
                                projectId={projectDetails.id}
                                onClose={() => {
                                  setActiveGroup(null);
                                  setSelectedState(null);
                                }}
                                workspaceSlug={workspaceSlug as string}
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

export const getServerSideProps = async (ctx: NextPageContext) => {
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
