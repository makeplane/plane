import React, { useEffect, useState } from "react";
// next
import Image from "next/image";
import type { NextPage } from "next";
// react hook form
import { useForm } from "react-hook-form";
// react dropzone
import Dropzone from "react-dropzone";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import ProjectLayout from "layouts/ProjectLayout";
// services
import userService from "lib/services/user.service";
import fileServices from "lib/services/file.services";
// ui
import { Button, Input, Spinner } from "ui";
// types
import type { IUser } from "types";
import { UserIcon } from "@heroicons/react/24/outline";

const defaultValues: Partial<IUser> = {
  avatar: "",
  first_name: "",
  last_name: "",
  email: "",
};

const Profile: NextPage = () => {
  const [image, setImage] = useState<File | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const { user: myProfile, mutateUser } = useUser();

  const onSubmit = (formData: IUser) => {
    userService
      .updateUser(formData)
      .then((response) => {
        console.log(response);
        mutateUser(response, false);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<IUser>({ defaultValues });

  useEffect(() => {
    reset({ ...defaultValues, ...myProfile });
  }, [myProfile, reset]);

  return (
    <ProjectLayout
      meta={{
        title: "Plane - My Profile",
      }}
    >
      <div className="w-full h-full md:px-20 p-8 flex flex-wrap overflow-auto gap-y-10 justify-center items-center">
        {myProfile ? (
          <>
            <div className="w-2/5">
              <Dropzone
                multiple={false}
                accept={{
                  "image/*": [],
                }}
                onDrop={(files) => {
                  setImage(files[0]);
                }}
              >
                {({ getRootProps, getInputProps }) => (
                  <div className="space-y-4">
                    <input {...getInputProps()} />
                    <h2 className="font-semibold text-xl">Profile Picture</h2>
                    <div className="relative">
                      <span
                        className="inline-block h-24 w-24 rounded-full overflow-hidden bg-gray-100"
                        {...getRootProps()}
                      >
                        {(!watch("avatar") || watch("avatar") === "") &&
                        (!image || image === null) ? (
                          <UserIcon className="h-full w-full text-gray-300" />
                        ) : (
                          <div className="relative h-24 w-24 overflow-hidden">
                            <Image
                              src={image ? URL.createObjectURL(image) : watch("avatar")}
                              alt={myProfile.first_name}
                              layout="fill"
                              objectFit="cover"
                              priority
                            />
                          </div>
                        )}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      Max file size is 500kb. Supported file types are .jpg and .png.
                    </p>
                  </div>
                )}
              </Dropzone>
              <Button
                type="button"
                className="mt-4"
                onClick={() => {
                  if (image === null) return;
                  setIsImageUploading(true);
                  const formData = new FormData();
                  formData.append("asset", image);
                  formData.append("attributes", JSON.stringify({}));
                  fileServices
                    .uploadFile(formData)
                    .then((response) => {
                      const imageUrl = response.asset;
                      setValue("avatar", imageUrl);
                      handleSubmit(onSubmit)();
                      setIsImageUploading(false);
                    })
                    .catch((err) => {
                      setIsImageUploading(false);
                    });
                }}
              >
                {isImageUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
            <div className="mt-5 w-3/5">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  <h2 className="font-semibold text-xl">Details</h2>
                  <div className="flex gap-x-4">
                    <div className="flex-grow">
                      <Input
                        name="first_name"
                        id="first_name"
                        register={register}
                        error={errors.first_name}
                        label="First Name"
                        placeholder="Enter your first name"
                        autoComplete="off"
                        validations={{
                          required: "This field is required.",
                        }}
                      />
                    </div>
                    <div className="flex-grow">
                      <Input
                        name="last_name"
                        register={register}
                        error={errors.last_name}
                        id="last_name"
                        label="Last Name"
                        placeholder="Enter your last name"
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  <div>
                    <Input
                      id="email"
                      type="email"
                      register={register}
                      error={errors.email}
                      name="email"
                      validations={{
                        required: "Email is required",
                      }}
                      label="Email"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Button disabled={isSubmitting} type="submit">
                      {isSubmitting ? "Updating Profile..." : "Update Profile"}
                    </Button>
                  </div>

                  {/* <div>
                    <Button type="submit" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Update"}
                    </Button>
                    {myProfile.is_email_verified || (
                      <button
                        type="button"
                        className="ml-2 text-indigo-600"
                        onClick={() => {
                          requestEmailVerification()
                            .then(() => {
                              setToastAlert({
                                type: "success",
                                title: "Verification email sent.",
                                message: "Please check your email.",
                              });
                            })
                            .catch((err) => {
                              console.error(err);
                            });
                        }}
                      >
                        Verify Your Email
                      </button>
                    )}
                  </div> */}
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="w-full mx-auto h-full flex justify-center items-center">
            <Spinner />
          </div>
        )}
      </div>
    </ProjectLayout>
  );
};

export default Profile;
