import { FC } from "react";
import Image from "next/image";
import { Button } from "@plane/ui";

// assets
import PlaneTakeOffImage from "@/public/images/plane-takeoff.png";

type TInstanceNotReady = {
  isRedirectionEnabled: boolean;
  handleSignUpToggle?: () => void;
};

export const InstanceNotReady: FC<TInstanceNotReady> = (props) => {
  const { isRedirectionEnabled = true, handleSignUpToggle } = props;

  return (
    <div className="h-full w-full relative container px-5 mx-auto flex justify-center items-center">
      <div className="w-auto max-w-2xl relative space-y-8 py-10">
        <div className="relative flex flex-col justify-center items-center space-y-4">
          <h1 className="text-3xl font-bold">Welcome aboard Plane!</h1>
          <Image src={PlaneTakeOffImage} alt="Plane Logo" />
          <p className="font-medium text-base text-custom-text-400">
            Get started by setting up your instance and workspace
          </p>
        </div>

        {isRedirectionEnabled && (
          <Button size="lg" className="w-full" onClick={handleSignUpToggle}>
            Get started
          </Button>
        )}
      </div>
    </div>
  );
};
