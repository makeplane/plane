"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
// plane imports
import { API_BASE_URL } from "@plane/constants";
import { Button, TOAST_TYPE, setToast } from "@plane/ui";
// hooks
import { useAppRouter } from "@/hooks/use-app-router";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// images
import maintenanceModeDarkModeImage from "@/public/instance/maintenance-mode-dark.svg";
import maintenanceModeLightModeImage from "@/public/instance/maintenance-mode-light.svg";
// services
import { AuthService } from "@/services/auth.service";

// services
const authService = new AuthService();

export default function CustomErrorComponent() {
  // routers
  const router = useAppRouter();
  // hooks
  const { resolvedTheme } = useTheme();

  const handleSignOut = async () => {
    await authService
      .signOut(API_BASE_URL)
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        })
      )
      .finally(() => router.push("/"));
  };

  // derived values
  const maintenanceModeImage = resolvedTheme === "dark" ? maintenanceModeDarkModeImage : maintenanceModeLightModeImage;

  return (
    <DefaultLayout>
      <div className="relative container mx-auto h-full w-full max-w-xl flex flex-col gap-2 items-center justify-center gap-y-6 bg-custom-background-100 text-center px-6">
        <div className="relative w-full">
          <Image
            src={maintenanceModeImage}
            height="176"
            width="288"
            alt="ProjectSettingImg"
            className="w-full h-full object-fill object-center"
          />
        </div>
        <div className="w-full relative flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2.5">
            <h1 className="text-xl font-semibold text-custom-text-100 text-left">
              &#x1F6A7; Yikes! That doesn&apos;t look good.
            </h1>
            <span className="text-base font-medium text-custom-text-200 text-left">
              That crashed Plane, pun intended. No worries, though. Our engineers have been notified. If you have more
              details, please write to{" "}
              <a href="mailto:support@plane.so" className="text-custom-primary">
                support@plane.so
              </a>{" "}
              or on our{" "}
              <a
                href="https://discord.com/invite/A92xrEGCge"
                target="_blank"
                className="text-custom-primary"
                rel="noopener noreferrer"
              >
                Discord
              </a>
              .
            </span>
          </div>

          <div className="flex items-center justify-start gap-2">
            <Button variant="primary" size="md" onClick={() => router.push("/")}>
              Go to home
            </Button>
            <Button variant="neutral-primary" size="md" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
