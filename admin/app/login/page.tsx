// layouts
import { DefaultLayout } from "@/layouts";
// components
import { PageHeader } from "@/components/core";
import { InstanceSignInForm } from "@/components/user-authentication-forms";

const LoginPage = () => (
  <>
    <PageHeader title="Setup - God Mode" />
    <DefaultLayout>
      <InstanceSignInForm />
    </DefaultLayout>
  </>
);

export default LoginPage;
