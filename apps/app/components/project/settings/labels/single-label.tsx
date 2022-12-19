// react
import React, { useState } from "react";
// react-hook-form
import { Controller, useForm } from "react-hook-form";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button, CustomMenu, Input } from "ui";
// icons
import { PencilIcon, RectangleGroupIcon } from "@heroicons/react/24/outline";
// types
import { IIssueLabels } from "types";
import { TwitterPicker } from "react-color";

type Props = {
  label: IIssueLabels;
  issueLabels: IIssueLabels[];
  editLabel: (label: IIssueLabels) => void;
  handleLabelDelete: (labelId: string) => void;
};

const defaultValues: Partial<IIssueLabels> = {
  name: "",
  colour: "#ff0000",
};

const SingleLabel: React.FC<Props> = ({ label, issueLabels, editLabel, handleLabelDelete }) => {
  const [newLabelForm, setNewLabelForm] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    reset,
    control,
  } = useForm<IIssueLabels>({ defaultValues });

  const children = issueLabels?.filter((l) => l.parent === label.id);

  return (
    <>
      {children && children.length === 0 ? (
        <div className="md:w-2/3 gap-2 border p-3 rounded-md divide-y space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span
                className="flex-shrink-0 h-3 w-3 rounded-full"
                style={{
                  backgroundColor: label.colour,
                }}
              />
              <h6 className="text-sm">{label.name}</h6>
            </div>
            <CustomMenu ellipsis>
              <CustomMenu.MenuItem>Convert to group</CustomMenu.MenuItem>
              <CustomMenu.MenuItem
                onClick={() => {
                  editLabel(label);
                }}
              >
                Edit
              </CustomMenu.MenuItem>
              <CustomMenu.MenuItem onClick={() => handleLabelDelete(label.id)}>
                Delete
              </CustomMenu.MenuItem>
            </CustomMenu>
          </div>
          <div className={`flex items-center gap-2 ${newLabelForm ? "" : "hidden"}`}>
            <div className="flex-shrink-0 h-8 w-8">
              <Popover className="relative w-full h-full flex justify-center items-center bg-gray-200 rounded-xl">
                {({ open }) => (
                  <>
                    <Popover.Button
                      className={`group inline-flex items-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        open ? "text-gray-900" : "text-gray-500"
                      }`}
                    >
                      {watch("colour") && watch("colour") !== "" && (
                        <span
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: watch("colour") ?? "green",
                          }}
                        ></span>
                      )}
                    </Popover.Button>

                    <Transition
                      as={React.Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="opacity-0 translate-y-1"
                      enterTo="opacity-100 translate-y-0"
                      leave="transition ease-in duration-150"
                      leaveFrom="opacity-100 translate-y-0"
                      leaveTo="opacity-0 translate-y-1"
                    >
                      <Popover.Panel className="absolute top-full z-20 left-0 mt-3 px-2 w-screen max-w-xs sm:px-0">
                        <Controller
                          name="colour"
                          control={control}
                          render={({ field: { value, onChange } }) => (
                            <TwitterPicker
                              color={value}
                              onChange={(value) => onChange(value.hex)}
                            />
                          )}
                        />
                      </Popover.Panel>
                    </Transition>
                  </>
                )}
              </Popover>
            </div>
            <div className="w-full flex flex-col justify-center">
              <Input
                type="text"
                id="labelName"
                name="name"
                register={register}
                placeholder="Lable title"
                validations={{
                  required: "Label title is required",
                }}
                error={errors.name}
              />
            </div>
            <Button type="button" theme="secondary" onClick={() => setNewLabelForm(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={isSubmitting}>
              {isSubmitting ? "Adding" : "Add"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 text-gray-900 rounded-md">
          <h3 className="font-medium leading-5 flex items-center gap-2">
            <RectangleGroupIcon className="h-5 w-5" />
            This is the label group title
          </h3>
          <div className="pl-5 mt-4">
            <div className="group text-sm flex justify-between items-center p-2 hover:bg-gray-100 rounded">
              <h5 className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                This is the label title
              </h5>
              <button type="button" className="hidden group-hover:block">
                <PencilIcon className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleLabel;
