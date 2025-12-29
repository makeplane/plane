import { useState, Fragment, useEffect } from "react";
import { TwitterPicker } from "react-color";
import { Controller, useForm } from "react-hook-form";
import { usePopper } from "react-popper";
import { Loader } from "lucide-react";
import { Popover } from "@headlessui/react";
import { PlusIcon, CloseIcon } from "@plane/propel/icons";
import type { IIssueLabel } from "@plane/types";
// hooks
import { Input } from "@plane/ui";
// ui
// types
import type { TLabelOperations } from "./root";

type ILabelCreate = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  values: string[];
  labelOperations: TLabelOperations;
  disabled?: boolean;
};

const defaultValues: Partial<IIssueLabel> = {
  name: "",
  color: "#ff0000",
};

export function LabelCreate(props: ILabelCreate) {
  const { workspaceSlug, projectId, issueId, values, labelOperations, disabled = false } = props;
  // state
  const [isCreateToggle, setIsCreateToggle] = useState(false);
  const handleIsCreateToggle = () => setIsCreateToggle(!isCreateToggle);
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);
  // react hook form
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setFocus,
  } = useForm<Partial<IIssueLabel>>({
    defaultValues,
  });

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "bottom-start",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  useEffect(() => {
    if (!isCreateToggle) return;

    setFocus("name");
    reset();
  }, [isCreateToggle, reset, setFocus]);

  const handleLabel = async (formData: Partial<IIssueLabel>) => {
    if (!workspaceSlug || !projectId || isSubmitting) return;

    const labelResponse = await labelOperations.createLabel(workspaceSlug, projectId, formData);
    const currentLabels = [...(values || []), labelResponse.id];
    await labelOperations.updateIssue(workspaceSlug, projectId, issueId, { label_ids: currentLabels });
    handleIsCreateToggle();
    reset(defaultValues);
  };

  return (
    <>
      <div
        className="relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded-full border border-subtle p-0.5 px-2 text-11 text-tertiary transition-all hover:bg-surface-2 hover:text-secondary"
        onClick={handleIsCreateToggle}
      >
        <div className="flex-shrink-0">
          {isCreateToggle ? <CloseIcon className="h-2.5 w-2.5" /> : <PlusIcon className="h-2.5 w-2.5" />}
        </div>
        <div className="flex-shrink-0">{isCreateToggle ? "Cancel" : "New"}</div>
      </div>

      {isCreateToggle && (
        <form className="relative flex items-center gap-x-2 p-1" onSubmit={handleSubmit(handleLabel)}>
          <div>
            <Controller
              name="color"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Popover>
                  <>
                    <Popover.Button as={Fragment}>
                      <button type="button" ref={setReferenceElement} className="grid place-items-center outline-none">
                        {value && value?.trim() !== "" && (
                          <span
                            className="h-5 w-5 rounded-sm"
                            style={{
                              backgroundColor: value ?? "black",
                            }}
                          />
                        )}
                      </button>
                    </Popover.Button>
                    <Popover.Panel className="fixed z-10">
                      <div
                        className="p-2 max-w-xs sm:px-0"
                        ref={setPopperElement}
                        style={styles.popper}
                        {...attributes.popper}
                      >
                        <TwitterPicker triangle={"hide"} color={value} onChange={(value) => onChange(value.hex)} />
                      </div>
                    </Popover.Panel>
                  </>
                </Popover>
              )}
            />
          </div>
          <Controller
            control={control}
            name="name"
            rules={{
              required: "This is required",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="name"
                name="name"
                type="text"
                value={value ?? ""}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.name)}
                placeholder="Title"
                className="w-full text-11 px-1.5 py-1"
                disabled={isSubmitting}
              />
            )}
          />
          <button
            type="button"
            className="grid place-items-center rounded-sm bg-danger-primary p-1"
            onClick={() => setIsCreateToggle(false)}
            disabled={disabled}
          >
            <CloseIcon className="h-3.5 w-3.5 text-on-color" />
          </button>
          <button
            type="submit"
            className="grid place-items-center rounded-sm bg-success-primary p-1"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader className="spin h-3.5 w-3.5 text-on-color" />
            ) : (
              <PlusIcon className="h-3.5 w-3.5 text-on-color" />
            )}
          </button>
        </form>
      )}
    </>
  );
}
