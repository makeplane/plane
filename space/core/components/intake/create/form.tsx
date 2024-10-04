import Link from "next/link";
import { usePathname } from "next/navigation";
import { Controller, useFormContext } from "react-hook-form";
import { IProject } from "@plane/types";
import { Button, Input, TextArea } from "@plane/ui";
import { ProjectLogo } from "@/components/common";
import { useUser } from "@/hooks/store";

type TProps = {
  project: Partial<IProject>;
  isSubmitting: boolean;
};

const IssueForm = ({ project, isSubmitting }: TProps) => {
  const {
    formState: { errors },
    control,
  } = useFormContext();
  const pathName = usePathname();

  // hooks
  const { data: currentUser } = useUser();
  return (
    <>
      <div className="space-y-5">
        <div className="mb-6">
          <h3 className="text-xl font-medium text-custom-text-200">Create Issue</h3>
          <div className="text-sm text-custom-text-300 flex gap-2">
            <span> This issue will be added to the intake of the project</span>
            <span className="my-auto flex capitalize">
              {project.logo_props && <ProjectLogo logo={project.logo_props} className="text-sm my-auto mr-1" />}
              <span> {project.name}</span>
            </span>
          </div>
        </div>
        <div className="space-y-1 flew-grow w-full">
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
            render={({ field: { value, onChange } }) => (
              <Input
                id="name"
                type="name"
                name="name"
                value={value}
                onChange={onChange}
                hasError={Boolean(errors.name)}
                placeholder="Title"
                className="w-full text-base"
                autoFocus
              />
            )}
          />
          <span className="text-xs text-red-500">{errors?.name?.message?.toString()}</span>
        </div>
        <div>
          <Controller
            name="description"
            control={control}
            render={({ field: { value, onChange } }) => (
              <TextArea
                name="description"
                placeholder="Description"
                className="w-full text-base resize-none min-h-24"
                hasError={Boolean(errors?.description)}
                value={value}
                onChange={onChange}
              />
            )}
          />
        </div>
      </div>
      <div className="pt-4 flex items-center justify-end gap-2">
        {currentUser?.id && (
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Creating" : "Create issue"}
          </Button>
        )}
        {!currentUser && (
          <Link href={`/?next_path=${pathName}`}>
            <Button variant="outline-primary">Sign in</Button>
          </Link>
        )}
      </div>
    </>
  );
};

export default IssueForm;
