// types
import useToast from "lib/hooks/useToast";
import { useForm } from "react-hook-form";
import { IUser } from "types";
import { Input } from "ui";

type Props = {
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

const InviteMembers: React.FC<Props> = ({ setStep }) => {
  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IUser>();

  const onSubmit = (formData: IUser) => {
    console.log(formData);
  };

  return (
    <form className="grid w-full place-items-center space-y-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="w-full space-y-4 rounded-lg bg-white p-8 md:w-2/5">
        <h2 className="text-2xl font-medium">Invite co-workers to your team</h2>
        <div className="space-y-4">
          <div className="col-span-2 space-y-2">
            <Input
              label="Enter e-mails to invite"
              name="email_ids"
              placeholder="dummy@plane.so,dummy@gmail.com"
              register={register}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto h-1/4 lg:w-1/4">
        <button
          type="submit"
          className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
          onClick={() => setStep(4)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Inviting..." : "Invite"}
        </button>
      </div>
    </form>
  );
};

export default InviteMembers;
