import { useState } from "react";
// swr
import useSWR from "swr";
// constants
import { STATE_LIST } from "constants/fetch-keys";
// services
import stateService from "lib/services/state.service";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import SettingsLayout from "layouts/settings-layout";
// components
import ConfirmStateDeletion from "components/project/issues/BoardView/state/confirm-state-delete";
import {
  CreateUpdateStateInline,
  StateGroup,
} from "components/project/issues/BoardView/state/create-update-state-inline";
// ui
import { BreadcrumbItem, Breadcrumbs, Loader } from "ui";
// icons
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
// types
import { IState } from "types";
// common
import { addSpaceIfCamelCase, groupBy } from "constants/common";

const StatesSettings = () => {
  const [activeGroup, setActiveGroup] = useState<StateGroup>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectDeleteState, setSelectDeleteState] = useState<string | null>(null);

  const { activeWorkspace, activeProject } = useUser();

  const { data: states } = useSWR(
    activeWorkspace && activeProject ? STATE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => stateService.getStates(activeWorkspace.slug, activeProject.id)
      : null
  );

  const groupedStates: {
    [key: string]: IState[];
  } = groupBy(states ?? [], "group");

  return (
    <>
      <ConfirmStateDeletion
        isOpen={!!selectDeleteState}
        data={states?.find((state) => state.id === selectDeleteState) ?? null}
        onClose={() => setSelectDeleteState(null)}
      />
      <SettingsLayout
        type="project"
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem
              title={`${activeProject?.name ?? "Project"}`}
              link={`/projects/${activeProject?.id}/issues`}
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
            {states && activeProject ? (
              Object.keys(groupedStates).map((key) => (
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
                        projectId={activeProject.id}
                        onClose={() => {
                          setActiveGroup(null);
                          setSelectedState(null);
                        }}
                        workspaceSlug={activeWorkspace?.slug}
                        data={null}
                        selectedGroup={key as keyof StateGroup}
                      />
                    )}
                    {groupedStates[key]?.map((state) =>
                      state.id !== selectedState ? (
                        <div
                          key={state.id}
                          className={`flex items-center justify-between gap-2 border-b bg-gray-50 p-3 ${
                            Boolean(activeGroup !== key) ? "last:border-0" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 flex-shrink-0 rounded-full"
                              style={{
                                backgroundColor: state.color,
                              }}
                            ></div>
                            <h6 className="text-sm">{addSpaceIfCamelCase(state.name)}</h6>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setSelectDeleteState(state.id)}>
                              <TrashIcon className="h-4 w-4 text-red-400" />
                            </button>
                            <button type="button" onClick={() => setSelectedState(state.id)}>
                              <PencilSquareIcon className="h-4 w-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className={`border-b last:border-b-0`} key={state.id}>
                          <CreateUpdateStateInline
                            projectId={activeProject.id}
                            onClose={() => {
                              setActiveGroup(null);
                              setSelectedState(null);
                            }}
                            workspaceSlug={activeWorkspace?.slug}
                            data={states?.find((state) => state.id === selectedState) ?? null}
                            selectedGroup={key as keyof StateGroup}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))
            ) : (
              <Loader className="space-y-5 md:w-2/3">
                <Loader.Item height="40px"></Loader.Item>
                <Loader.Item height="40px"></Loader.Item>
                <Loader.Item height="40px"></Loader.Item>
                <Loader.Item height="40px"></Loader.Item>
              </Loader>
            )}
          </div>
        </div>
      </SettingsLayout>
    </>
  );
};

export default StatesSettings;
