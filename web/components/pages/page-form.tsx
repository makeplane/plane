import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input, Tooltip } from "@plane/ui";
// types
import { IPage } from "types";
// constants
import { PAGE_ACCESS_SPECIFIERS } from "constants/page";

type Props = {
  handleFormSubmit: (values: IPage) => Promise<void>;
  handleClose: () => void;
  data?: IPage | null;
};

const defaultValues = {
  name: "",
  description: "",
  access: 0,
};

export const PageForm: React.FC<Props> = (props) => {
  const { handleFormSubmit, handleClose, data } = props;

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    control,
  } = useForm<IPage>({
    defaultValues: { ...defaultValues, ...data },
  });

  const handleCreateUpdatePage = async (formData: IPage) => {
    await handleFormSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleCreateUpdatePage)}>
      <div className="space-y-4">
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">{data ? "Update" : "Create"} Page</h3>
        <div className="space-y-3">
          <div>
            <Controller
              control={control}
              name="name"
              rules={{
                required: "Title is required",
                maxLength: {
                  value: 255,
                  message: "Title should be less than 255 characters",
                },
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="name"
                  type="text"
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.name)}
                  placeholder="Title"
                  className="w-full resize-none text-lg"
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <Controller
          control={control}
          name="access"
          render={({ field: { value, onChange } }) => (
            <div className="flex items-center gap-2">
              <div className="flex flex-shrink-0 items-stretch gap-0.5 rounded border-[0.5px] border-custom-border-200 p-1">
                {PAGE_ACCESS_SPECIFIERS.map((access) => (
                  <Tooltip key={access.key} tooltipContent={access.label}>
                    <button
                      type="button"
                      onClick={() => onChange(access.key)}
                      className={`grid aspect-square place-items-center rounded-sm p-1 hover:bg-custom-background-90 ${
                        value === access.key ? "bg-custom-background-90" : ""
                      }`}
                    >
                      <access.icon
                        className={`h-3.5 w-3.5 ${
                          value === access.key ? "text-custom-text-100" : "text-custom-text-400"
                        }`}
                        strokeWidth={2}
                      />
                    </button>
                  </Tooltip>
                ))}
              </div>
              <h6 className="text-xs font-medium">
                {PAGE_ACCESS_SPECIFIERS.find((access) => access.key === value)?.label}
              </h6>
            </div>
          )}
        />
        <div className="flex items-center gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {data ? (isSubmitting ? "Updating..." : "Update page") : isSubmitting ? "Creating..." : "Create Page"}
          </Button>
        </div>
      </div>
    </form>
  );
};
