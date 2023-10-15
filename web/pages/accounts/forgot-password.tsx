import { NextPage } from "next";
import Image from "next/image";
// components
import { EmailForgotPasswordForm, EmailForgotPasswordFormValues } from "components/account";
// layouts
import DefaultLayout from "layouts/default-layout";
// services
import { UserService } from "services/user.service";
// hooks
import useToast from "hooks/use-toast";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";

const userService = new UserService();

const ForgotPasswordPage: NextPage = () => {
  // toast
  const { setToastAlert } = useToast();

  const handleForgotPassword = (formData: EmailForgotPasswordFormValues) => {
    const payload = {
      email: formData.email,
    };

    return userService
      .forgotPassword(payload)
      .then(() =>
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "Password reset link has been sent to your email address.",
        })
      )
      .catch((err) => {
        if (err.status === 400)
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Please check the Email ID entered.",
          });
        else
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong. Please try again.",
          });
      });
  };
  return (
    <DefaultLayout>
      <>
        <div className="hidden sm:block sm:fixed border-r-[0.5px] border-custom-border-200 h-screen w-[0.5px] top-0 left-20 lg:left-32" />
        <div className="fixed grid place-items-center bg-custom-background-100 sm:py-5 top-11 sm:top-12 left-7 sm:left-16 lg:left-28">
          <div className="grid place-items-center bg-custom-background-100">
            <div className="h-[30px] w-[30px]">
              <Image src={BluePlaneLogoWithoutText} alt="Plane Logo" />
            </div>
          </div>
        </div>
      </>
      <div className="grid place-items-center h-full overflow-y-auto py-6 px-7">
        <div>
          <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-custom-text-100">Forgot Password</h1>
          <EmailForgotPasswordForm onSubmit={handleForgotPassword} />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ForgotPasswordPage;
