import { Metadata } from "next";
// layouts
import { DefaultLayout } from "@/layouts/default-layout";
// components
import { InstanceSignUpForm } from "./components";

export const metadata: Metadata = {
  title: "Setup - God Mode",
};

export default function SetupPage() {
  return (
    <>
      <DefaultLayout>
        <InstanceSignUpForm />
      </DefaultLayout>
    </>
  );
}
