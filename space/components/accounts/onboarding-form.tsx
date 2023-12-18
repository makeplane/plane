import { useEffect, Fragment } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { Controller, useForm } from "react-hook-form";
import { Listbox, Transition } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// constants
import { USER_ROLES } from "constants/workspace";
// hooks
import useToast from "hooks/use-toast";
// services
import { UserService } from "services/user.service";
// ui
import { Button, Input } from "@plane/ui";

const defaultValues = {
  first_name: "",
  last_name: "",
  role: "",
};

type Props = {
  user?: any;
};

export const OnBoardingForm: React.FC<Props> = observer(({ user }) => {
  const { setToastAlert } = useToast();

  const router = useRouter();
  const { next_path } = router.query;

  const { user: userStore } = useMobxStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm({
    defaultValues,
  });

  const onSubmit = async (formData: any) => {
    const payload = {
      ...formData,
      onboarding_step: {
        ...user.onboarding_step,
        profile_complete: true,
      },
    };

    const userService = new UserService();

    await userService.updateMe(payload).then((response) => {
      userStore.setCurrentUser(response);
      router.push(next_path?.toString() || "/");
      setToastAlert({
        type: "success",
        title: "Success!",
        message: "Details updated successfully.",
      });
    });
  };

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      });
    }
  }, [user, reset]);

  return (
    <form
      className="h-full w-full space-y-7 overflow-y-auto sm:flex sm:flex-col sm:items-start sm:justify-center sm:space-y-10"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="relative sm:text-lg">
        <div className="absolute -left-3 -top-1 text-gray-800">{'"'}</div>
        <h5>Hey there 👋🏻</h5>
        <h5 className="mb-6 mt-5">Let{"'"}s get you onboard!</h5>
        <h4 className="text-xl font-semibold sm:text-2xl">Set up your Plane profile.</h4>
      </div>

      <div className="space-y-7 sm:w-3/4 md:w-2/5">
        <div className="space-y-1 text-sm">
          <label htmlFor="firstName">First Name</label>
          <Input
            id="firstName"
            autoComplete="off"
            className="w-full"
            placeholder="Enter your first name..."
            {...register("first_name", {
              required: "First name is required",
            })}
          />
          {errors.first_name && <div className="text-sm text-red-500">{errors.first_name.message}</div>}
        </div>
        <div className="space-y-1 text-sm">
          <label htmlFor="lastName">Last Name</label>
          <Input
            id="lastName"
            autoComplete="off"
            className="w-full"
            placeholder="Enter your last name..."
            {...register("last_name", {
              required: "Last name is required",
            })}
          />
          {errors.last_name && <div className="text-sm text-red-500">{errors.last_name.message}</div>}
        </div>
        <div className="space-y-1 text-sm">
          <span>What{"'"}s your role?</span>
          <div className="w-full">
            <Controller
              name="role"
              control={control}
              rules={{ required: "This field is required" }}
              render={({ field: { value, onChange } }) => (
                <Listbox as="div" value={value} onChange={onChange} className="relative flex-shrink-0 text-left">
                  <Listbox.Button
                    type="button"
                    className={`flex w-full items-center justify-between gap-1 rounded-md border border-custom-border-300 px-3 py-2 text-sm shadow-sm duration-300 focus:outline-none`}
                  >
                    <span className={value ? "" : "text-custom-text-400"}>{value || "Select your role..."}</span>
                    <ChevronDown className="h-3 w-3" aria-hidden="true" strokeWidth={2} />
                  </Listbox.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Listbox.Options
                      className={`absolute left-0 z-10 mt-1 max-h-36 w-full origin-top-left overflow-y-auto rounded-md border border-custom-border-300 bg-custom-background-90 text-xs shadow-lg focus:outline-none`}
                    >
                      <div className="space-y-1 p-2">
                        {USER_ROLES.map((role) => (
                          <Listbox.Option
                            key={role.value}
                            value={role.value}
                            className={({ active, selected }) =>
                              `cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                                active || selected ? "bg-custom-background-80" : ""
                              } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                            }
                          >
                            {({ selected }) => (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span>{role.label}</span>
                                </div>
                                {selected && <Check className="h-3 w-3 flex-shrink-0" strokeWidth={2} />}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </div>
                    </Listbox.Options>
                  </Transition>
                </Listbox>
              )}
            />
            {errors.role && <span className="text-sm text-red-500">{errors.role.message}</span>}
          </div>
        </div>
      </div>

      <Button variant="primary" type="submit" size="xl" disabled={!isValid} loading={isSubmitting}>
        {isSubmitting ? "Updating..." : "Continue"}
      </Button>
    </form>
  );
});
