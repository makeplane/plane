import { useEffect } from "react";

import { useForm } from "react-hook-form";

// hooks
import useToast from "hooks/use-toast";
// services
import userService from "services/user.service";
// ui
import { Input } from "components/ui";
// types
import { IUser } from "types";

const defaultValues: Partial<IUser> = {
  first_name: "",
  last_name: "",
  role: "",
};

type Props = {
  user?: IUser;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

const UserDetails: React.FC<Props> = ({ user, setStep }) => {
  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IUser>({
    defaultValues,
  });

  const onSubmit = async (formData: IUser) => {
    await userService
      .updateUser(formData)
      .then(() => {
        setToastAlert({
          title: "User details updated successfully!",
          type: "success",
        });
        setStep(2);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    if (user)
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      });
  }, [user, reset]);

  return (
    <form className="grid w-full place-items-center" onSubmit={handleSubmit(onSubmit)}>
      <div className="w-full space-y-8 rounded-lg bg-white p-8 md:w-2/5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="First Name"
              name="first_name"
              placeholder="Enter first name"
              autoComplete="off"
              register={register}
              validations={{
                required: "First name is required",
              }}
              error={errors.first_name}
            />
          </div>
          <div>
            <Input
              label="Last Name"
              name="last_name"
              placeholder="Enter last name"
              autoComplete="off"
              register={register}
              validations={{
                required: "Last name is required",
              }}
              error={errors.last_name}
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Role"
              name="role"
              placeholder="What is your role?"
              autoComplete="off"
              register={register}
              validations={{
                required: "Role is required",
              }}
              error={errors.role}
            />
          </div>
        </div>
        <div className="mx-auto h-1/4 lg:w-1/2">
          <button
            type="submit"
            className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Continue"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default UserDetails;
