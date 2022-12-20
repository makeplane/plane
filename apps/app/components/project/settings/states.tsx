import React, { useState } from "react";
// hooks
import useUser from "lib/hooks/useUser";
// components
import {
  StateGroup,
  CreateUpdateStateInline,
} from "components/project/issues/BoardView/state/create-update-state-inline";
import ConfirmStateDeletion from "components/project/issues/BoardView/state/confirm-state-delete";
// ui
import { Spinner } from "ui";
// icons
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
// constants
import { addSpaceIfCamelCase, groupBy } from "constants/common";
// types
import type { IState } from "types";

type Props = {
  projectId: string;
};

const StatesSettings: React.FC<Props> = ({ projectId }) => {
  const [activeGroup, setActiveGroup] = useState<StateGroup>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectDeleteState, setSelectDeleteState] = useState<string | null>(null);

  const { states, activeWorkspace } = useUser();

  const groupedStates: {
    [key: string]: Array<IState>;
  } = groupBy(states ?? [], "group");

  return (
    <>
      <ConfirmStateDeletion
        isOpen={!!selectDeleteState}
        data={states?.find((state) => state.id === selectDeleteState) ?? null}
        onClose={() => setSelectDeleteState(null)}
      />

      <section className="space-y-8">
        <div>
          <h3 className="text-3xl font-bold leading-6 text-gray-900">State</h3>
          <p className="mt-4 text-sm text-gray-500">Manage the state of this project.</p>
        </div>
        <div className="flex flex-col justify-between gap-4">
          {states ? (
            Object.keys(groupedStates).map((key) => (
              <div key={key}>
                <div className="flex justify-between w-full md:w-2/3 mb-2">
                  <p className="text-md leading-6 text-gray-900 capitalize">{key} states</p>
                  <button
                    type="button"
                    onClick={() => setActiveGroup(key as keyof StateGroup)}
                    className="flex items-center gap-x-2 text-theme"
                  >
                    <PlusIcon className="h-4 w-4 text-theme" />
                    <span>Add</span>
                  </button>
                </div>
                <div className="md:w-2/3 space-y-1 border p-1 rounded-xl">
                  {key === activeGroup && (
                    <CreateUpdateStateInline
                      projectId={projectId as string}
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
                        className={`bg-gray-50 p-3 flex justify-between items-center gap-2 border-t ${
                          Boolean(activeGroup !== key) ? "first:border-0" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-shrink-0 h-3 w-3 rounded-full"
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
                      <div className={`border-t first:border-t-0`} key={state.id}>
                        <CreateUpdateStateInline
                          projectId={projectId as string}
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
            <div className="h-full w-full grid place-items-center px-4 sm:px-0">
              <Spinner />
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default StatesSettings;
