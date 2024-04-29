"use client";

// layouts
import { DefaultLayout } from "@/layouts";
// components
import { PageHeader } from "@/components/core";
import { InstanceSignInForm } from "./components";

const LoginPage = () => (
  <>
    <PageHeader title="Setup - God Mode" />
    <DefaultLayout>
      <InstanceSignInForm />
    </DefaultLayout>
  </>
);

export default LoginPage;
