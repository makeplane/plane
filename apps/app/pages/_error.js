/**
 * NOTE: This requires `@sentry/nextjs` version 7.3.0 or higher.
 *
 * NOTE: If using this with `next` version 12.2.0 or lower, uncomment the
 * penultimate line in `CustomErrorComponent`.
 *
 * This page is loaded by Nextjs:
 *  - on the server, when data-fetching methods throw or reject
 *  - on the client, when `getInitialProps` throws or rejects
 *  - on the client, when a React lifecycle method throws or rejects, and it's
 *    caught by the built-in Nextjs error boundary
 *
 * See:
 *  - https://nextjs.org/docs/basic-features/data-fetching/overview
 *  - https://nextjs.org/docs/api-reference/data-fetching/get-initial-props
 *  - https://reactjs.org/docs/error-boundaries.html
 */

import * as Sentry from "@sentry/nextjs";

import { useRouter } from "next/router";

// services
import authenticationService from "services/authentication.service";
// hooks
import useToast from "hooks/use-toast";
// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";

const CustomErrorComponent = () => {
  const router = useRouter();

  const { setToastAlert } = useToast();

  const handleSignOut = async () => {
    await authenticationService
      .signOut()
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Failed to sign out. Please try again.",
        })
      )
      .finally(() => router.push("/signin"));
  };

  return (
    <DefaultLayout
      meta={{
        title: "Plane - Exception Detected",
        description: "Exception Detected",
      }}
    >
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Exception Detected!</h3>
            <p className="text-sm text-gray-500 w-1/2 mx-auto">
              We{"'"}re Sorry! An exception has been detected, and our engineering team has been
              notified. We apologize for any inconvenience this may have caused. Please reach out to
              our engineering team at{" "}
              <a href="mailto:support@plane.so" className="text-theme">
                support@plane.so
              </a>{" "}
              or on our{" "}
              <a
                href="https://discord.com/invite/A92xrEGCge"
                target="_blank"
                className="text-theme"
                rel="noopener noreferrer"
              >
                Discord
              </a>{" "}
              server for further assistance.
            </p>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <PrimaryButton size="md" onClick={() => router.back()}>
              Go back
            </PrimaryButton>
            <SecondaryButton size="md" onClick={handleSignOut}>
              Sign out
            </SecondaryButton>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

CustomErrorComponent.getInitialProps = async (contextData) => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits
  await Sentry.captureUnderscoreErrorException(contextData);

  const { res, err } = contextData;

  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;

  return { statusCode };
};

export default CustomErrorComponent;
