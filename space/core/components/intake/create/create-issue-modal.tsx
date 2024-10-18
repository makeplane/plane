import { FormProvider, useForm } from "react-hook-form";
import { IProject } from "@plane/types";
import { Card, ECardSpacing } from "@plane/ui";
import IssueForm from "./form";
import FormSuccess from "./success";

type TProps = {
  project: Partial<IProject>;
};
const CreateIssueModal = ({ project }: TProps) => {
  // form data
  const methods = useForm();
  const {
    formState: { isSubmitting, isSubmitted },
    handleSubmit,
  } = methods;
  if (!project) return null;

  const onSubmit = async (data) => {
    console.log(data);
  };

  return (
    <FormProvider {...methods}>
      {!isSubmitted && (
        <Card spacing={ECardSpacing.SM} className="m-auto max-w-[375px] md:max-w-[575px] custom-sidebar-shadow-4xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <IssueForm project={project} isSubmitting={isSubmitting} />
          </form>
        </Card>
      )}
      {isSubmitted && <FormSuccess />}
    </FormProvider>
  );
};
export default CreateIssueModal;
