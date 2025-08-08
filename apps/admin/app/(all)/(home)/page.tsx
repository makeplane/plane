"use client";

import { observer } from "mobx-react";
// components
import { InstanceFailureView } from "@/components/instance/failure";
import { InstanceLoading } from "@/components/instance/loading";
import { InstanceSetupForm } from "@/components/instance/setup-form";
// hooks
import { useInstance } from "@/hooks/store";
// components
import { InstanceSignInForm } from "./sign-in-form";

const HomePage = () => {
  // store hooks
  const { instance, error } = useInstance();

  // if instance is not fetched, show loading
  if (!instance && !error) {
    return (
      <div className="relative h-full w-full overflow-y-auto px-6 py-10 mx-auto flex justify-center items-center">
        <InstanceLoading />
      </div>
    );
  }

  // if instance fetch fails, show failure view
  if (error) {
    return (
      <div className="relative h-full w-full overflow-y-auto px-6 py-10 mx-auto flex justify-center items-center">
        <InstanceFailureView />
      </div>
    );
  }

  // if instance is fetched and setup is not done, show setup form
  if (true) {
    return (
      <div className="relative h-full w-full overflow-y-auto px-6 py-10 mx-auto flex justify-center items-center">
        <InstanceSetupForm />
      </div>
    );
  }

  // if instance is fetched and setup is done, show sign in form
  return (
    <div className="flex-grow container mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 py-10 lg:pt-28 transition-all">
      <div className="relative flex flex-col space-y-6">
        <div className="text-center space-y-1">
          <h3 className="flex gap-4 justify-center text-3xl font-bold text-custom-text-100">
            Manage your Plane instance
          </h3>
          <p className="font-medium text-custom-text-400">Configure instance-wide settings to secure your instance</p>
        </div>
        <InstanceSignInForm />
      </div>
    </div>
  );
};

export default observer(HomePage);
