import * as Sentry from "@sentry/nextjs";

import { useRouter } from "next/router";

// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { Button } from "@plane/ui";

// services
const authService = new AuthService();

const CustomErrorComponent = () => {
  const router = useRouter();

  const { setToastAlert } = useToast();

  const handleSignOut = async () => {
    await authService
      .signOut()
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        })
      )
      .finally(() => router.push("/"));
  };

  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Exception Detected!</h3>
            <p className="mx-auto w-1/2 text-sm text-custom-text-200">
              We{"'"}re Sorry! An exception has been detected, and our engineering team has been notified. We apologize
              for any inconvenience this may have caused. Please reach out to our engineering team at{" "}
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
              </a>{" "}
              server for further assistance.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="primary" size="md" onClick={() => router.reload()}>
              Refresh
            </Button>
            <Button variant="neutral-primary" size="md" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

CustomErrorComponent.getInitialProps = async (contextData: any) => {
  await Sentry.captureUnderscoreErrorException(contextData);

  const { res, err } = contextData;

  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;

  return { statusCode };
};

export default CustomErrorComponent;
