// layouts
import { DefaultLayout } from "@/layouts";
// components
import { PageHeader } from "@/components/core";
import { InstanceSignUpForm } from "@/components/user-authentication-forms";

const SetupPage = () => (
  <>
    <PageHeader title="Setup - God Mode" />
    <DefaultLayout>
      <InstanceSignUpForm />
    </DefaultLayout>
  </>
);

export default SetupPage;
