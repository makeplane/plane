import { useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { EditorRefApi } from "@plane/editor";
import { IProject } from "@plane/types";
import { Card, ECardSpacing, setToast, TOAST_TYPE } from "@plane/ui";
import { useIntake } from "@/plane-web/hooks/store/use-intake";
import IssueForm from "./form";
import FormSuccess from "./success";

type TProps = {
  project: Partial<IProject>;
  anchor: string;
};
export type TFormData = {
  email: string;
  username: string;
  description_html: string;
  name: string;
};

const CreateIssueModal = ({ project, anchor }: TProps) => {
  const [success, setSuccess] = useState(false);
  const descriptionEditorRef = useRef<EditorRefApi>(null);

  const [formSubmitting, setFormSubmitting] = useState(false);
  // form info
  const methods = useForm<TFormData>({
    defaultValues: { email: "", username: "", description_html: "", name: "" },
    reValidateMode: "onChange",
  });
  const { handleSubmit } = methods;

  const { publishIntakeForm } = useIntake();

  if (!project) return null;

  const onSubmit = async (formData: Partial<TFormData>) => {
    // async request which may result error;
    try {
      if (!descriptionEditorRef.current?.isEditorReadyToDiscard()) {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Editor is still processing changes. Please wait before proceeding.",
        });
        return;
      }

      const payload: TFormData = {
        name: formData.name || "",
        description_html: formData.description_html || "<p></p>",
        email: formData.email || "",
        username: formData.username || "",
      };

      setFormSubmitting(true);
      await publishIntakeForm(anchor.toString(), payload);
      setSuccess(true);
      setFormSubmitting(false);
    } catch (e) {
      // handle your error
      console.log(e);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "error",
        message: "Something went wrong",
      });
      setFormSubmitting(false);
    }
  };

  return (
    <div className="contents">
      {!success && (
        <Card spacing={ECardSpacing.SM} className="m-auto max-w-[375px] md:max-w-[575px] custom-sidebar-shadow-4xl">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <IssueForm
                anchor={anchor}
                project={project}
                isSubmitting={formSubmitting}
                descriptionEditorRef={descriptionEditorRef}
              />
            </form>
          </FormProvider>
        </Card>
      )}
      {success && <FormSuccess />}
    </div>
  );
};
export default CreateIssueModal;
