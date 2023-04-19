// types
import { useForm } from "react-hook-form";
import useToast from "hooks/use-toast";
import workspaceService from "services/workspace.service";
import { IUser } from "types";
// ui components
import { MultiInput, PrimaryButton, SecondaryButton } from "components/ui";

type Props = {
  setStep: React.Dispatch<React.SetStateAction<number>>;
  workspace: any;
};

export const InviteMembers: React.FC<Props> = ({ setStep, workspace }) => {
  const { setToastAlert } = useToast();

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<IUser>();

  const onSubmit = async (formData: IUser) => {
    await workspaceService
      .inviteWorkspace(workspace.slug, formData)
      .then(() => {
        setToastAlert({
          type: "success",
          title: "Invitations sent!",
        });
        setStep(4);
      })
      .catch((err) => console.log(err));
  };

  return (
    <form
      className="flex w-full items-center justify-center"
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.code === "Enter") e.preventDefault();
      }}
    >
      <div className="flex w-full max-w-xl flex-col gap-12">
        <div className="flex flex-col gap-6  rounded-[10px] bg-white px-10 py-7 shadow-md">
          <h2 className="text-2xl font-medium ">Invite co-workers to your team</h2>
          <div className="flex flex-col items-start justify-center gap-2.5 ">
            <span>Email</span>
            <div className="w-full">
              <MultiInput
                name="emails"
                placeholder="Enter co-workers email id"
                watch={watch}
                setValue={setValue}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-center gap-3 ">
          <PrimaryButton
            type="submit"
            className="flex w-1/2 items-center justify-center text-center"
            disabled={isSubmitting}
            size="md"
          >
            {isSubmitting ? "Inviting..." : "Continue"}
          </PrimaryButton>

          <SecondaryButton
            type="button"
            className="w-1/2 rounded-lg bg-transparent border-none"
            size="md"
            outline
            onClick={() => setStep(4)}
          >
            Skip
          </SecondaryButton>
        </div>
      </div>
    </form>
  );
};
