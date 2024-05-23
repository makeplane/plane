import React, { Fragment, useState } from "react";
import { observer } from "mobx-react";
// types
import { ChevronLeft, Plus } from "lucide-react";
import { IEstimate, IEstimateFormData } from "@plane/types";
// ui
import { SubHeading, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { RadioInput } from "@/components/radio-group";
import { Sortable } from "@/components/sortable/sortable";
import { EstimateItem } from "./estimate-item";
import { useEstimate } from "@/hooks/store";
import { useRouter } from "next/router";
// helpers
// hooks

type Props = {
  isOpen: boolean;
  handleClose: () => void;
  data?: IEstimate;
};

const ESTIMATE_SYSTEMS = {
  Points: {
    name: "Points",
    templates: {
      Fibonacci: [1, 2, 3, 5, 8, 13, 21],
      Linear: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      Squares: [1, 4, 9, 16, 25, 36],
    },
  },
  Categories: {
    name: "Categories",
    templates: {
      "T-Shirt Sizes": ["XS", "S", "M", "L", "XL", "XXL"],
      "Easy to hard": ["Easy", "Medium", "Hard", "Very Hard"],
    },
  },
  Time: {
    name: "Time",
    templates: { Hours: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
  },
};

type EstimatePoint = {
  id?: string;
  key: number;
  value: string;
};
export const UpdateEstimateModal: React.FC<Props> = observer((props) => {
  const { handleClose, isOpen, data } = props;
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  const { createEstimate, updateEstimate } = useEstimate();

  console.log({ data });

  const [estimateSystem, setEstimateSystem] = useState("Points");
  const [points, setPoints] = useState<EstimatePoint[] | null>(data.points);

  const currentEstimateSystem = ESTIMATE_SYSTEMS[estimateSystem];

  const deleteItem = (index: number) => {
    points.splice(index, 1);
    setPoints([...points]);
  };

  const saveEstimate = async () => {
    if (!workspaceSlug || !projectId || !data) return;

    console.log({ points });

    const payload: IEstimateFormData = {
      estimate_points: points?.map((point, index) => {
        point.key = index;
        return point;
      }),
      estimate: {
        name: data.name,
        description: data.description,
      },
    };

    console.log({ payload });

    await updateEstimate(workspaceSlug.toString(), projectId.toString(), data.id, payload)
      .then(() => {
        // onClose();
      })
      .catch((err) => {
        const error = err?.error;
        const errorString = Array.isArray(error) ? error[0] : error;

        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: errorString ?? "Estimate could not be updated. Please try again.",
        });
      });
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <div className="p-5">
        {!points && (
          <Fragment>
            <div className="flex justify-between items-center mb-6">
              <div className="flex justify-start align-middle  items-center ">
                <SubHeading noMargin>New Estimate System</SubHeading>
              </div>
              <div>
                <span className="text-xs text-gray-400">Step 2/2</span>
              </div>
            </div>
            <form onSubmit={() => console.log("Submitted")}>
              <div className="space-y-4 sm:flex sm:items-center sm:space-x-10 sm:space-y-0 gap-2 mb-2">
                <RadioInput
                  options={Object.keys(ESTIMATE_SYSTEMS).map((name) => ({ label: name, value: name }))}
                  label="Choose an estimate system"
                  selected={estimateSystem}
                  onChange={(value) => setEstimateSystem(value)}
                  className="mb-4"
                />
              </div>
              <SubHeading>Choose a template</SubHeading>
              <div className="flex flex-wrap gap-5 grid sm:grid-cols-2 mb-8">
                {Object.keys(currentEstimateSystem.templates).map((name) => (
                  <button
                    key={name}
                    className="  border border-custom-border-200 rounded-md p-2 text-left"
                    onClick={() =>
                      setPoints(
                        currentEstimateSystem.templates[name].map((value: number | string, key: number) => ({
                          value,
                          key,
                        }))
                      )
                    }
                  >
                    <p className="block text-sm">{name}</p>
                    <p className="text-xs text-gray-400">{currentEstimateSystem.templates[name].join(", ")}</p>
                  </button>
                ))}
              </div>

              {/* Add modal footer */}
            </form>
          </Fragment>
        )}

        {points && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div className="flex justify-start   items-center">
                <button onClick={() => setPoints(null)}>
                  <ChevronLeft className="w-6 h-6 mr-1" />
                </button>
                <SubHeading noMargin>New Estimate System</SubHeading>
              </div>
              <div>
                <span className="text-xs text-gray-400">Step 2/2</span>
              </div>
            </div>

            <Sortable
              data={points}
              render={(value: string, index: number) => (
                <EstimateItem item={value} deleteItem={() => deleteItem(index)} />
              )}
              onChange={(data: number[]) => setPoints(data)}
              keyExtractor={(value: number) => value}
            />
            <button
              className=" bg-custom-primary text-white rounded-md px-3 py-1 flex items-center gap-1"
              onClick={() => {
                setPoints([...points, ""]);
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add {estimateSystem}</span>
            </button>
          </div>
        )}

        <div className="flex justify-end mt-5 border-t -m-5 px-5 py-3 ">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex justify-center px-4 py-1 text-sm font-medium text-white bg-custom-primary border border-transparent rounded-md shadow-sm hover:bg-custom-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-primary-dark"
          >
            Cancel
          </button>
          {points && (
            <button
              type="submit"
              className="inline-flex justify-center px-4 py-1 ml-3 text-sm font-medium text-white bg-custom-primary border border-transparent rounded-md shadow-sm hover:bg-custom-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-primary-dark"
              onClick={saveEstimate}
            >
              Create Estimate
            </button>
          )}
        </div>
      </div>
    </ModalCore>
  );
});
