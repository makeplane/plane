import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
// hooks
import useProjectDetails from "hooks/use-project-details";
import useUserAuth from "hooks/use-user-auth";
// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// components
import {
  CreateUpdateStateInline,
  DeleteStateModal,
  SingleState,
  StateGroup,
} from "components/states";
import { SettingsHeader } from "components/project";
// ui
import { Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { getStatesList, orderStateGroups } from "helpers/state.helper";
import { truncateText } from "helpers/string.helper";
// types
import type { NextPage } from "next";
// fetch-keys
import { STATES_LIST } from "constants/fetch-keys";

const StatesSettings: NextPage = () => {
  const [activeGroup, setActiveGroup] = useState<StateGroup>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectDeleteState, setSelectDeleteState] = useState<string | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { user } = useUserAuth();

  const { projectDetails } = useProjectDetails();

  const { data: states } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
    workspaceSlug && projectId
      ? () => stateService.getStates(workspaceSlug as string, projectId as string)
      : null
  );
  const orderedStateGroups = orderStateGroups(states);
  const statesList = getStatesList(orderedStateGroups);

  return (
    <>
      <DeleteStateModal
        isOpen={!!selectDeleteState}
        data={statesList?.find((s) => s.id === selectDeleteState) ?? null}
        onClose={() => setSelectDeleteState(null)}
        user={user}
      />
      <ProjectAuthorizationWrapper
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${truncateText(projectDetails?.name ?? "Project", 32)}`}
              link={`/${workspaceSlug}/projects/${projectDetails?.id}/issues`}
              linkTruncate
            />
            <BreadcrumbItem title="States Settings" unshrinkTitle />
          </Breadcrumbs>
        }
      >
        <div className="p-8">
          <SettingsHeader />
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 sm:col-span-5">
              <h3 className="text-2xl font-semibold text-custom-text-100">States</h3>
              <p className="text-custom-text-200">Manage the states of this project.</p>
            </div>
            <div className="col-span-12 space-y-8 sm:col-span-7">
              {states && projectDetails && orderedStateGroups ? (
                Object.keys(orderedStateGroups).map((key) => {
                  if (orderedStateGroups[key].length !== 0)
                    return (
                      <div key={key}>
                        <div className="mb-2 flex w-full justify-between">
                          <h4 className="text-custom-text-200 capitalize">{key}</h4>
                          <button
                            type="button"
                            className="flex items-center gap-2 text-custom-primary-100 hover:text-custom-primary-200 outline-none"
                            onClick={() => setActiveGroup(key as keyof StateGroup)}
                          >
                            <PlusIcon className="h-4 w-4" />
                            Add
                          </button>
                        </div>
                        <div className="divide-y divide-custom-border-200 rounded-[10px] border border-custom-border-200">
                          {key === activeGroup && (
                            <CreateUpdateStateInline
                              groupLength={orderedStateGroups[key].length}
                              onClose={() => {
                                setActiveGroup(null);
                                setSelectedState(null);
                              }}
                              data={null}
                              selectedGroup={key as keyof StateGroup}
                              user={user}
                            />
                          )}
                          {orderedStateGroups[key].map((state, index) =>
                            state.id !== selectedState ? (
                              <SingleState
                                key={state.id}
                                index={index}
                                state={state}
                                statesList={statesList ?? []}
                                handleEditState={() => setSelectedState(state.id)}
                                handleDeleteState={() => setSelectDeleteState(state.id)}
                                user={user}
                              />
                            ) : (
                              <div
                                className="border-b border-custom-border-200 last:border-b-0"
                                key={state.id}
                              >
                                <CreateUpdateStateInline
                                  onClose={() => {
                                    setActiveGroup(null);
                                    setSelectedState(null);
                                  }}
                                  groupLength={orderedStateGroups[key].length}
                                  data={
                                    statesList?.find((state) => state.id === selectedState) ?? null
                                  }
                                  selectedGroup={key as keyof StateGroup}
                                  user={user}
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
        </div>
      </ProjectAuthorizationWrapper>
    </>
  );
};

export default StatesSettings;
