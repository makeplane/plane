import { Metadata } from "next";
// components
import { InstanceSetupForm } from "@/components/instance";

export const metadata: Metadata = {
  title: "Setup - God Mode",
};

export default function SetupPage() {
  return <InstanceSetupForm />;
}
