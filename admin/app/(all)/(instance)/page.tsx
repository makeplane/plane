"use client";

// components
import { InstanceSignInForm } from "./sign-in-form";

export default function HomePage() {
  return (
    <div className="flex-grow container mx-auto max-w-lg px-10 lg:max-w-md lg:px-5 py-10 lg:pt-28 transition-all">
      <div className="relative flex flex-col space-y-6">
        <div className="text-center space-y-1">
          <h3 className="flex gap-4 justify-center text-3xl font-bold text-onboarding-text-100">
            Manage your Plane instance
          </h3>
          <p className="font-medium text-onboarding-text-400">
            Configure instance-wide settings to secure your instance
          </p>
        </div>
        <InstanceSignInForm />
      </div>
    </div>
  );
}
