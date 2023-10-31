import Image from "next/image";
// layouts
import DefaultLayout from "layouts/default-layout";
// components
import { EmailPasswordForm, EmailPasswordFormValues } from "components/account";
// images
import BluePlaneLogoWithoutText from "public/plane-logos/blue-without-text.png";
// services
import { InstanceService } from "services/instance.service";
import { useRouter } from "next/router";
import { useEffect } from "react";

const instanceService = new InstanceService();

const ActivateInstancePage = () => {
  const router = useRouter();

  useEffect(() => {
    instanceService.checkForInstanceStatus().then((response) => {
      console.log(response);
    });
  }, []);

  const handleSignUp = (values: EmailPasswordFormValues) =>
    instanceService
      .createInstance(values)
      .then((response) => {
        router.push("/");
      })
      .catch((error) => {});

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
      <div className="grid place-items-center h-full w-full overflow-y-auto py-5 px-7">
        <div>
          <h1 className="text-3xl text-center font-bold">Activate Your Instance</h1>
          <EmailPasswordForm
            onSubmit={handleSignUp}
            buttonText="Activate Instance"
            submittingButtonText="Activating Instance"
          />
        </div>
      </div>
    </DefaultLayout>
  );
};

export default ActivateInstancePage;
