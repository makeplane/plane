// types
import useToast from "lib/hooks/useToast";
import workspaceService from "lib/services/workspace.service";
import { useForm } from "react-hook-form";
import { IUser } from "types";
import MultiInput from "ui/multi-input";
import OutlineButton from "ui/outline-button";

type Props = {
  setStep: React.Dispatch<React.SetStateAction<number>>;
  workspace: any;
};

const InviteMembers: React.FC<Props> = ({ setStep, workspace }) => {
  const { setToastAlert } = useToast();

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IUser>();

  const onSubmit = (formData: IUser) => {
    console.log(formData);
    workspaceService
      .inviteWorkspace(workspace.slug, formData)
      .then((res) => {
        console.log(res);
        setToastAlert({
          type: "success",
          title: "Invitations sent!",
        });
        setStep(4);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const validateEmail = (email: string) => {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  return (
    <form
      className="grid w-full place-items-center space-y-8"
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={(e) => {
        if (e.code === "Enter") e.preventDefault();
      }}
    >
      <div className="w-full space-y-4 rounded-lg bg-white p-8 md:w-2/5">
        <h2 className="text-2xl font-medium">Invite co-workers to your team</h2>
        <div className="space-y-4">
          <div className="col-span-2 space-y-2">
            <MultiInput
              label="Enter e-mails to invite"
              name="emails"
              placeholder="dummy@plane.so"
              watch={watch}
              setValue={setValue}
              validateInput={validateEmail}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto h-1/4 space-y-4 lg:w-1/4">
        <button
          type="submit"
          className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Inviting..." : "Invite"}
        </button>
        <OutlineButton theme="secondary" className="w-full" onClick={() => setStep(4)}>
          Skip
        </OutlineButton>
      </div>
    </form>
  );
};

export default InviteMembers;
