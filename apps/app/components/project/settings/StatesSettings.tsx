import React, { useState } from "react";
// hooks
import useUser from "lib/hooks/useUser";
// components
import {
  StateGroup,
  CreateUpdateStateInline,
} from "components/project/issues/BoardView/state/create-update-state-inline";
import ConfirmStateDeletion from "components/project/issues/BoardView/state/confirm-state-delete";
// icons
import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
// constants
import { addSpaceIfCamelCase, groupBy } from "constants/common";
// types
import type { IState } from "types";

type Props = {
  projectId: string | string[] | undefined;
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

      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">State</h3>
          <p className="mt-1 text-sm text-gray-500">Manage the state of this project.</p>
        </div>
        <div className="flex flex-col justify-between gap-3">
          {Object.keys(groupedStates).map((key) => (
            <React.Fragment key={key}>
              <div className="flex justify-between w-full md:w-2/3">
                <p className="font-medium capitalize">{key} states</p>
                <button
                  type="button"
                  onClick={() => setActiveGroup(key as keyof StateGroup)}
                  className="flex items-center gap-x-2 text-theme"
                >
                  <PlusIcon className="h-4 w-4 text-theme" />
                  <span>Add</span>
                </button>
              </div>
              <div className="w-full md:w-2/3 space-y-1 border p-1 rounded-xl bg-gray-50">
                <div className="w-full">
                  {groupedStates[key]?.map((state) =>
                    state.id !== selectedState ? (
                      <div
                        key={state.id}
                        className={`bg-gray-50 px-5 py-4 flex justify-between items-center border-b ${
                          Boolean(activeGroup !== key) ? "last:border-0" : ""
                        }`}
                      >
                        <div className="flex items-center gap-x-8">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{
                              backgroundColor: state.color,
                            }}
                          ></div>
                          <h4>{addSpaceIfCamelCase(state.name)}</h4>
                        </div>
                        <div className="flex gap-x-2">
                          <button type="button" onClick={() => setSelectDeleteState(state.id)}>
                            <TrashIcon className="h-5 w-5 text-red-400" />
                          </button>
                          <button type="button" onClick={() => setSelectedState(state.id)}>
                            <PencilSquareIcon className="h-5 w-5 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`border-b last:border-b-0`} key={state.id}>
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
              </div>
            </React.Fragment>
          ))}
        </div>
      </section>
    </>
  );
};

export default StatesSettings;
