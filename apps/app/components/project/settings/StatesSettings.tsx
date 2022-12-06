// react
import { useState } from "react";
// hooks
import useUser from "lib/hooks/useUser";
// components
import CreateUpdateStateModal from "components/project/issues/BoardView/state/CreateUpdateStateModal";
// ui
import { Button } from "ui";
// icons
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
// constants
import { addSpaceIfCamelCase } from "constants/common";

type Props = {
  projectId: string | string[] | undefined;
};

const StatesSettings: React.FC<Props> = ({ projectId }) => {
  const [isCreateStateModal, setIsCreateStateModal] = useState(false);
  const [selectedState, setSelectedState] = useState<string | undefined>();

  const { states } = useUser();

  return (
    <>
      <CreateUpdateStateModal
        isOpen={isCreateStateModal || Boolean(selectedState)}
        handleClose={() => {
          setSelectedState(undefined);
          setIsCreateStateModal(false);
        }}
        projectId={projectId as string}
        data={selectedState ? states?.find((state) => state.id === selectedState) : undefined}
      />
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">State</h3>
          <p className="mt-1 text-sm text-gray-500">Manage the state of this project.</p>
        </div>
        <div className="flex justify-between gap-3">
          <div className="w-full space-y-5">
            {states?.map((state) => (
              <div
                key={state.id}
                className="bg-white px-4 py-2 rounded flex justify-between items-center"
              >
                <div className="flex items-center gap-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: state.color,
                    }}
                  ></div>
                  <h4>{addSpaceIfCamelCase(state.name)}</h4>
                </div>
                <div>
                  <button type="button" onClick={() => setSelectedState(state.id)}>
                    <PencilSquareIcon className="h-5 w-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              className="flex items-center gap-x-1"
              onClick={() => setIsCreateStateModal(true)}
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add State</span>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default StatesSettings;
