"use client";

import { observer } from "mobx-react";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { InstanceFailureView } from "@/components/instance/failure";
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
      <div className="flex items-center justify-center h-screen w-full">
        <LogoSpinner />
      </div>
    );
  }

  // if instance fetch fails, show failure view
  if (error) {
    return <InstanceFailureView />;
  }

  // if instance is fetched and setup is not done, show setup form
  if (instance && !instance?.is_setup_done) {
    return <InstanceSetupForm />;
  }

  // if instance is fetched and setup is done, show sign in form
  return <InstanceSignInForm />;
};

export default observer(HomePage);
