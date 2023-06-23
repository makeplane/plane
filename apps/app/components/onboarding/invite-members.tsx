// types
import { useForm } from "react-hook-form";
import useToast from "hooks/use-toast";
import workspaceService from "services/workspace.service";
import { ICurrentUserResponse, IUser } from "types";
// ui components
import { MultiInput, PrimaryButton, SecondaryButton } from "components/ui";

type Props = {
  setStep: React.Dispatch<React.SetStateAction<number | null>>;
  workspace: any;
  user: ICurrentUserResponse | undefined;
};

export const InviteMembers: React.FC<Props> = ({ setStep, workspace, user }) => {
  const { setToastAlert } = useToast();

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<IUser>();

  const onSubmit = async (formData: IUser) => {
    await workspaceService
      .inviteWorkspace(workspace.slug, formData, user)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Invitations sent successfully.",
        });
        setStep(4);
      })
      .catch((err) => console.log(err));
  };

  const checkEmail = watch("emails") && watch("emails").length > 0;
  return (
    <form
      className="w-full mt-6"
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.code === "Enter") e.preventDefault();
      }}
    >
      <div className="space-y-9">
        <h2 className="text-xl font-medium">Invite your co-workers</h2>

        <div className="md:w-1/3">
          <div className="space-y-1 text-sm">
            <span>Co-workers Email</span>
            <div className="w-full">
              <MultiInput
                name="emails"
                placeholder="Enter their email..."
                watch={watch}
                setValue={setValue}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <PrimaryButton type="submit" disabled={!checkEmail} loading={isSubmitting} size="md">
            {isSubmitting ? "Inviting..." : "Continue"}
          </PrimaryButton>
          <SecondaryButton size="md" outline onClick={() => setStep(4)}>
            Skip this step
          </SecondaryButton>
        </div>
      </div>
    </form>
  );
};
