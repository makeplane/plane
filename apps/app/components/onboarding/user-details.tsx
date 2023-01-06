// types
import useToast from "lib/hooks/useToast";
import userService from "lib/services/user.service";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { IUser } from "types";
import { CustomSelect, Input } from "ui";

type Props = {
  user: IUser | undefined;
  setStep: React.Dispatch<React.SetStateAction<number>>;
};

const UserDetails: React.FC<Props> = ({ user, setStep }) => {
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

    userService
      .updateUser(formData)
      .then((res) => {
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
    reset({
      first_name: user && user.first_name,
      last_name: user && user.last_name,
    });
  }, [user, reset]);

  return (
    <form className="grid w-full place-items-center space-y-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="w-full space-y-4 rounded-lg bg-white p-8 md:w-2/5">
        <h2 className="text-2xl font-medium">User Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="First name"
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
              label="Last name"
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
            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <CustomSelect {...field} label="What is your role?" input>
                  <CustomSelect.Option value="SDE">SDE</CustomSelect.Option>
                </CustomSelect>
              )}
            />
          </div>
        </div>
      </div>
      <div className="mx-auto h-1/4 lg:w-1/4">
        <button
          type="submit"
          className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Updating..." : "Continue"}
        </button>
      </div>
    </form>
  );
};

export default UserDetails;
