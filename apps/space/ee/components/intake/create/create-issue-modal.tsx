import { useRef, useState } from "react";
import { useTheme } from "next-themes";
import { FormProvider, useForm } from "react-hook-form";
// plane imports
import type { EditorRefApi } from "@plane/editor";
import type { IProject } from "@plane/types";
import { setToast, TOAST_TYPE, PlaneLogo } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useIntake } from "@/plane-web/hooks/store/use-intake";
// assets
import GridBgLight from "@/public/images/grid-bg-light.svg";
import GridBgDark from "@/public/images/grid-bg-dark.svg";
// local imports
import IssueForm from "./form";
import FormSuccess from "./success";
import Image from "next/image";
import IntakeInfo from "../info";
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
  // state
  const [success, setSuccess] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  // refs
  const descriptionEditorRef = useRef<EditorRefApi>(null);
  // hooks
  const { publishIntakeForm } = useIntake();
  const { resolvedTheme } = useTheme();
  // form info
  const methods = useForm<TFormData>({
    defaultValues: { email: "", username: "", description_html: "", name: "" },
    reValidateMode: "onChange",
  });
  const { handleSubmit, reset } = methods;

  // derived
  const gridBgImage = resolvedTheme === "dark" ? GridBgDark : GridBgLight;

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
      reset();
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
    <div className="w-full h-full flex flex-col bg-custom-background-100 ">
      {!success && <Image src={gridBgImage} alt="Grid Background" className="absolute top-0 left-0 w-full h-full " />}
      <div className="flex justify-between pt-6 px-page-x z-10">
        <div className="flex gap-2 items-center">
          <PlaneLogo className="h-6 w-auto text-custom-text-100" />
          <div className="text-2xl text-custom-text-100 font-semibold">Plane</div>
          <div className="text-2xl text-custom-text-300 font-semibold">Intake</div>
        </div>

        <IntakeInfo />
      </div>
      <div className="flex justify-center w-full h-full items-center overflow-y-scroll">
        {!success ? (
          <div
            className={cn(
              "p-4 rounded-md w-[375px] md:w-[575px] shadow-custom-shadow-xs border-[1px] z-[5] border-custom-border-200 bg-custom-background-90",
              {
                "bg-custom-background-100 border-custom-border-100  shadow-custom-shadow-sm": resolvedTheme === "light",
              }
            )}
          >
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
          </div>
        ) : (
          <FormSuccess onReset={() => setSuccess(false)} />
        )}
      </div>
    </div>
  );
};
export default CreateIssueModal;
